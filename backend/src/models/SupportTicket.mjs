import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Ticket must belong to a user"],
            index: true,
        },
        ticketNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true,
            maxlength: [150, "Subject cannot exceed 150 characters"],
        },
        category: {
            type: String,
            enum: ["Transactions", "Account Access", "Cards & PIN", "Fraud & Security", "Technical Issue", "General"],
            default: "General",
        },
        priority: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
            default: "MEDIUM",
        },
        status: {
            type: String,
            enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
            default: "OPEN",
            index: true,
        },
        messages: [
            {
                sender: {
                    type: String,
                    enum: ["CUSTOMER", "SUPPORT", "SYSTEM", "AI_AGENT"],
                    required: true,
                },
                senderName: {
                    type: String,
                    default: "Customer",
                },
                content: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: [2000, "Message cannot exceed 2000 characters"],
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        aiAssisted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

supportTicketSchema.index({ user: 1, status: 1, createdAt: -1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
