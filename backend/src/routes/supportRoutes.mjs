import express from "express";
import { protect } from "../middleware/authMiddleware.mjs";
import { restrictTo } from "../middleware/roleMiddleware.mjs";
import SupportTicket from "../models/SupportTicket.mjs";
import { ROLES } from "../constants/index.mjs";

const router = express.Router();

// 1. Get all tickets for current user
router.get("/", protect, async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: tickets.length, tickets });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to retrieve support tickets." });
    }
});

// 2. Create a new support ticket
router.post("/", protect, async (req, res) => {
    try {
        const { subject, category, priority, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ success: false, message: "Subject and message are required." });
        }

        const ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

        const ticket = await SupportTicket.create({
            user: req.user._id,
            ticketNumber,
            subject: subject.trim(),
            category: category || "General",
            priority: priority || "MEDIUM",
            messages: [
                {
                    sender: "CUSTOMER",
                    senderName: `${req.user.firstName} ${req.user.lastName}`,
                    content: message.trim(),
                },
            ],
        });

        return res.status(201).json({
            success: true,
            message: "Support ticket registered successfully.",
            ticket,
        });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

// 3. Add message to an existing ticket
router.post("/:id/messages", protect, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: "Message content cannot be blank." });
        }

        const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id });
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found." });
        }

        ticket.messages.push({
            sender: "CUSTOMER",
            senderName: `${req.user.firstName} ${req.user.lastName}`,
            content: content.trim(),
        });
        if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
            ticket.status = "OPEN";
        }
        await ticket.save();

        return res.status(200).json({ success: true, ticket });
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
});

// 4. Admin: View all support tickets
router.get("/admin/all", protect, restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
    try {
        const tickets = await SupportTicket.find().populate("user", "firstName lastName email phone").sort({ createdAt: -1 });
        return res.status(200).json({ success: true, count: tickets.length, tickets });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to retrieve administrative tickets." });
    }
});

// 5. AI Support Ticket Summary & Triage Assistant
router.post("/:id/ai-summary", protect, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        // If customer, only allow summarizing their own ticket
        if (req.user.role === ROLES.CUSTOMER) {
            query.user = req.user._id;
        }

        const ticket = await SupportTicket.findOne(query).populate("user", "firstName lastName email");
        if (!ticket) {
            return res.status(404).json({ success: false, message: "Ticket not found or unauthorized." });
        }

        const msgHistory = ticket.messages
            .map((m) => `${m.senderName} (${m.sender}): ${m.content}`)
            .join("\n");

        const summary = {
            ticketNumber: ticket.ticketNumber,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            messageCount: ticket.messages.length,
            keyIssue: ticket.messages[0]?.content?.slice(0, 200) || "No message content",
            recommendedAction:
                ticket.priority === "URGENT" || ticket.category === "Fraud & Security"
                    ? "Escalate immediately to Security & Fraud Operations Team."
                    : ticket.category === "Transactions"
                    ? "Verify transaction reference in core ledger and check idempotency log."
                    : "Review inquiry and provide standard retail support guidance.",
            aiProviderStatus: process.env.GEMINI_API_KEY ? "CONFIGURED_ACTIVE" : "UNAVAILABLE_FALLBACK",
            summaryText: `Ticket ${ticket.ticketNumber} [${ticket.category}] - ${ticket.priority} priority. Initiated with issue: "${ticket.subject}". Total message exchanges: ${ticket.messages.length}.`,
        };

        return res.status(200).json({
            success: true,
            summary,
        });
    } catch (error) {
        console.error("[AISupportSummary Error]:", error.message);
        return res.status(500).json({ success: false, message: "Failed to generate AI ticket summary." });
    }
});

export default router;

