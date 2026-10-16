import Account from "../models/Account.mjs";
import Transaction from "../models/Transaction.mjs";
import Transfer from "../models/Transfer.mjs";
import SavingsGoal from "../models/SavingsGoal.mjs";
import { roundMoney, addMoney, subtractMoney } from "../utils/money.mjs";

export const getCustomerExpenseAnalytics = async (userId) => {
    const userAccounts = await Account.find({ user: userId }).select("_id accountNumber").lean();
    const accountIds = userAccounts.map((a) => a._id);
    const accountIdStrings = new Set(accountIds.map((id) => String(id)));

    // Find internal transfers between user's own accounts to eliminate double-counting
    const internalTransfers = await Transfer.find({
        senderAccount: { $in: accountIds },
        receiverAccount: { $in: accountIds },
        status: "SUCCESS",
    }).select("reference").lean();

    const internalTransferRefs = new Set();
    internalTransfers.forEach((it) => {
        if (it.reference) {
            internalTransferRefs.add(it.reference);
            internalTransferRefs.add(`${it.reference}-DR`);
            internalTransferRefs.add(`${it.reference}-CR`);
        }
    });

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month transactions
    const currentMonthTx = await Transaction.find({
        account: { $in: accountIds },
        user: userId,
        status: "SUCCESS",
        createdAt: { $gte: startOfCurrentMonth },
    }).lean();

    // Previous month transactions
    const prevMonthTx = await Transaction.find({
        account: { $in: accountIds },
        user: userId,
        status: "SUCCESS",
        createdAt: { $gte: startOfPreviousMonth, $lte: endOfPreviousMonth },
    }).lean();

    // Category calculation helper
    const categorize = (desc, type) => {
        const text = (desc || "").toLowerCase();
        if (text.includes("rent") || text.includes("lease")) return "Housing";
        if (text.includes("electricity") || text.includes("bill") || text.includes("water") || text.includes("recharge")) return "Utilities";
        if (text.includes("swiggy") || text.includes("zomato") || text.includes("food") || text.includes("grocery") || text.includes("mart")) return "Food & Groceries";
        if (text.includes("uber") || text.includes("ola") || text.includes("fuel") || text.includes("petrol") || text.includes("metro")) return "Travel";
        if (text.includes("amazon") || text.includes("flipkart") || text.includes("shopping") || text.includes("myntra")) return "Shopping";
        if (text.includes("health") || text.includes("pharmacy") || text.includes("hospital") || text.includes("doctor")) return "Healthcare";
        if (type === "TRANSFER") return "Transfers & Remittance";
        if (type === "WITHDRAW") return "Cash Withdrawal";
        return "Miscellaneous";
    };

    let totalExpenseCurrent = 0;
    let totalIncomeCurrent = 0;
    const categoryBreakdown = {};

    currentMonthTx.forEach((tx) => {
        // Skip self/internal transfers between the user's own accounts
        if (tx.reference && internalTransferRefs.has(tx.reference)) {
            return;
        }

        const amt = Number(tx.amount) || 0;
        if (["WITHDRAW", "TRANSFER", "FEE"].includes(tx.type)) {
            totalExpenseCurrent = addMoney(totalExpenseCurrent, amt);
            const cat = categorize(tx.description, tx.type);
            categoryBreakdown[cat] = addMoney(categoryBreakdown[cat] || 0, amt);
        } else if (["DEPOSIT", "REFUND"].includes(tx.type)) {
            totalIncomeCurrent = addMoney(totalIncomeCurrent, amt);
        }
    });

    let totalExpensePrev = 0;
    let totalIncomePrev = 0;
    prevMonthTx.forEach((tx) => {
        if (tx.reference && internalTransferRefs.has(tx.reference)) {
            return;
        }

        const amt = Number(tx.amount) || 0;
        if (["WITHDRAW", "TRANSFER", "FEE"].includes(tx.type)) {
            totalExpensePrev = addMoney(totalExpensePrev, amt);
        } else if (["DEPOSIT", "REFUND"].includes(tx.type)) {
            totalIncomePrev = addMoney(totalIncomePrev, amt);
        }
    });

    // Formatting category breakdown for charts
    const categoryChartData = Object.keys(categoryBreakdown).map((cat) => ({
        name: cat,
        value: categoryBreakdown[cat],
        formattedValue: `₹${categoryBreakdown[cat].toLocaleString("en-IN")}`,
    }));

    // AI summary / commentary
    const expenseDiff = totalExpenseCurrent - totalExpensePrev;
    const isSpendingHigher = expenseDiff > 0;
    const aiInsight = totalExpenseCurrent === 0
        ? "No debits or expenses recorded for this billing cycle yet. Your financial profile is fully conservative."
        : `You have spent ₹${totalExpenseCurrent.toLocaleString("en-IN")} this month. That is ${
              totalExpensePrev > 0
                  ? `${Math.abs(Math.round((expenseDiff / totalExpensePrev) * 100))}% ${isSpendingHigher ? "higher" : "lower"} than last month.`
                  : "your primary recorded activity."
          } Top expenditure category: ${
              categoryChartData.length ? categoryChartData.sort((a, b) => b.value - a.value)[0].name : "General"
          }.`;

    return {
        currentMonth: {
            totalExpense: totalExpenseCurrent,
            formattedTotalExpense: `₹${totalExpenseCurrent.toLocaleString("en-IN")}`,
            totalIncome: totalIncomeCurrent,
            formattedTotalIncome: `₹${totalIncomeCurrent.toLocaleString("en-IN")}`,
            netSavings: totalIncomeCurrent - totalExpenseCurrent,
        },
        previousMonth: {
            totalExpense: totalExpensePrev,
            formattedTotalExpense: `₹${totalExpensePrev.toLocaleString("en-IN")}`,
            totalIncome: totalIncomePrev,
            formattedTotalIncome: `₹${totalIncomePrev.toLocaleString("en-IN")}`,
        },
        categoryBreakdown: categoryChartData,
        aiInsight,
    };
};

export const getSmartSavingsAdvice = async (userId) => {
    const goals = await SavingsGoal.find({ user: userId }).sort({ createdAt: -1 }).lean();
    const analytics = await getCustomerExpenseAnalytics(userId);

    const totalTarget = goals.reduce((acc, g) => acc + (Number(g.targetAmount) || 0), 0);
    const totalAccumulated = goals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);

    const recommendations = [];
    if (analytics.currentMonth.netSavings > 0) {
        recommendations.push({
            type: "ACCELERATE",
            title: "Surplus Liquidity Detected",
            advice: `You have a positive cash flow of ₹${analytics.currentMonth.netSavings.toLocaleString(
                "en-IN"
            )} this month. Consider contributing ₹${Math.round(
                analytics.currentMonth.netSavings * 0.4
            ).toLocaleString("en-IN")} towards your active savings goals.`,
        });
    } else {
        recommendations.push({
            type: "CONSERVE",
            title: "Maintain Buffer Reserve",
            advice: "Your expenditure currently matches or exceeds current deposits. Focus on maintaining an emergency fund with 3-6 months of expenses.",
        });
    }

    if (!goals.length) {
        recommendations.push({
            type: "CREATE_GOAL",
            title: "Define an Emergency Fund",
            advice: "Creating a dedicated savings target helps automate and track milestone progress without exposing your funds to accidental spending.",
        });
    }

    return {
        goals,
        summary: {
            totalGoals: goals.length,
            totalTarget,
            totalAccumulated,
            overallProgressPercentage: totalTarget > 0 ? Math.round((totalAccumulated / totalTarget) * 100) : 0,
        },
        recommendations,
    };
};
