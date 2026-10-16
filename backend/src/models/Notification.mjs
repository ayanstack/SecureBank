import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../constants/index.mjs";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Notification must belong to a user"],
            index: true,
        },

        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },

        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            maxlength: [500, "Message cannot exceed 500 characters"],
        },

        type: {
            type: String,
            enum: Object.values(NOTIFICATION_TYPES),
            required: [true, "Notification type is required"],
        },

        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;