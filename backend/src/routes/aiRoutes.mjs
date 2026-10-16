import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import { processBankingAssistantQuery, executeBankingTool } from "../services/aiBankingService.mjs";
import { getCustomerExpenseAnalytics, getSmartSavingsAdvice } from "../services/analyticsService.mjs";
import SavingsGoal from "../models/SavingsGoal.mjs";
import Transaction from "../models/Transaction.mjs";
import Account from "../models/Account.mjs";

const router = express.Router();

// 1. Natural language query to AI Banking Assistant
router.post("/chat", protect, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "A valid message string is required.",
            });
        }

        const response = await processBankingAssistantQuery({
            query: message.trim(),
            userId: req.user._id,
        });

        return res.status(200).json({
            success: true,
            reply: response.reply,
            data: response.data,
            verifiedFacts: response.verifiedFacts,
        });
    } catch (error) {
        console.error("[AIChat Error]:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to process banking assistant query.",
        });
    }
});

// 2. Natural Language Transaction Search
router.post("/search-transactions", protect, async (req, res) => {
    try {
        const { query } = req.body;
        if (!query || typeof query !== "string") {
            return res.status(400).json({ success: false, message: "Search query is required." });
        }

        const q = query.toLowerCase().trim();
        const userAccounts = await Account.find({ user: req.user._id }).select("_id accountNumber").lean();
        const accountIds = userAccounts.map((a) => a._id);

        const filter = {
            account: { $in: accountIds },
            user: req.user._id,
        };

        const now = new Date();
        let dateRangeApplied = null;

        // Date-range interpretation
        if (q.includes("last week") || q.includes("past week") || q.includes("previous week")) {
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filter.createdAt = { $gte: oneWeekAgo };
            dateRangeApplied = "Last 7 days";
        } else if (q.includes("this month") || q.includes("current month")) {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filter.createdAt = { $gte: startOfMonth };
            dateRangeApplied = "Current month";
        } else if (q.includes("today")) {
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filter.createdAt = { $gte: startOfToday };
            dateRangeApplied = "Today";
        }

        // Extract amount numbers if specified (e.g. above 2000, greater than 500, under 1000)
        const minAmountMatch = q.match(/(?:above|greater than|over|more than|>|exceeding)\s*₹?\s*(\d+)/i);
        if (minAmountMatch) {
            filter.amount = filter.amount || {};
            filter.amount.$gte = Number(minAmountMatch[1]);
        }

        const maxAmountMatch = q.match(/(?:below|under|less than|<)\s*₹?\s*(\d+)/i);
        if (maxAmountMatch) {
            filter.amount = filter.amount || {};
            filter.amount.$lte = Number(maxAmountMatch[1]);
        }

        // Type filter
        if (q.includes("deposit") || q.includes("credit") || q.includes("received")) {
            filter.type = "DEPOSIT";
        } else if (q.includes("transfer") || q.includes("sent") || q.includes("remittance")) {
            filter.type = "TRANSFER";
        } else if (q.includes("withdraw") || q.includes("cash")) {
            filter.type = "WITHDRAW";
        }

        // Status filter
        if (q.includes("failed") || q.includes("declined") || q.includes("rejected")) {
            filter.status = "FAILED";
        } else if (q.includes("success") || q.includes("settled") || q.includes("completed")) {
            filter.status = "SUCCESS";
        }

        // Bills / Utility spending filter
        const isBillQuery = q.includes("bill") || q.includes("utility") || q.includes("electricity") || q.includes("recharge");
        if (isBillQuery) {
            filter.description = { $regex: /bill|electricity|water|recharge|utility/i };
        }

        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("account", "accountNumber accountType")
            .lean();

        // If user asked "how much did I spend", calculate authoritative total
        let totalSum = null;
        if (q.includes("how much") || q.includes("total spend") || q.includes("total amount")) {
            totalSum = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        }

        return res.status(200).json({
            success: true,
            count: transactions.length,
            totalCalculated: totalSum !== null ? totalSum : undefined,
            formattedTotal: totalSum !== null ? `₹${totalSum.toLocaleString("en-IN")}` : undefined,
            dateRangeApplied,
            transactions,
            appliedFilters: {
                hasAmountFilter: Boolean(filter.amount),
                type: filter.type || "ALL",
                status: filter.status || "ALL",
                dateRange: dateRangeApplied || "All time",
                isBillQuery,
            },
        });
    } catch (error) {
        console.error("[AISearch Error]:", error.message);
        return res.status(500).json({
            success: false,
            message: "Search could not be processed.",
        });
    }
});

// 3. AI Expense Analytics
router.get("/expenses", protect, async (req, res) => {
    try {
        const analytics = await getCustomerExpenseAnalytics(req.user._id);
        return res.status(200).json({
            success: true,
            analytics,
        });
    } catch (error) {
        console.error("[Analytics Error]:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate expense analytics.",
        });
    }
});

// 4. Smart Savings Advisor & Goals
router.get("/savings", protect, async (req, res) => {
    try {
        const advice = await getSmartSavingsAdvice(req.user._id);
        return res.status(200).json({
            success: true,
            ...advice,
        });
    } catch (error) {
        console.error("[Savings Advice Error]:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve savings guidance.",
        });
    }
});

// 5. Create new Savings Goal
router.post("/savings/goals", protect, async (req, res) => {
    try {
        const { title, targetAmount, targetDate, category, notes } = req.body;

        if (!title || !targetAmount || !targetDate) {
            return res.status(400).json({
                success: false,
                message: "Title, target amount, and target date are required.",
            });
        }

        const goal = await SavingsGoal.create({
            user: req.user._id,
            title: title.trim(),
            targetAmount: Number(targetAmount),
            targetDate: new Date(targetDate),
            category: category || "Other",
            notes: notes || "",
        });

        return res.status(201).json({
            success: true,
            message: "Savings goal created successfully.",
            goal,
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message,
        });
    }
});

// 6. Update Savings Goal Contribution (Simulation)
router.post("/savings/goals/:id/contribute", protect, async (req, res) => {
    try {
        const { amount } = req.body;
        const numAmount = Number(amount);
        if (!numAmount || numAmount <= 0) {
            return res.status(400).json({ success: false, message: "Valid contribution amount is required." });
        }

        const goal = await SavingsGoal.findOne({ _id: req.params.id, user: req.user._id });
        if (!goal) {
            return res.status(404).json({ success: false, message: "Savings goal not found." });
        }

        goal.currentAmount = (goal.currentAmount || 0) + numAmount;
        if (goal.currentAmount >= goal.targetAmount) {
            goal.status = "ACHIEVED";
        }
        await goal.save();

        return res.status(200).json({
            success: true,
            message: `Contributed ₹${numAmount.toLocaleString("en-IN")} towards '${goal.title}'.`,
            goal,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

export default router;
