import mongoose from "mongoose";
import Notification from "../models/Notification.mjs";

// =========================
// GET MY NOTIFICATIONS (WITH PAGINATION)
// =========================
export const getMyNotifications = async (req, res) => {
    try {
        const { isRead, page = 1, limit = 20 } = req.query;

        const filter = {
            user: req.user.userId,
        };

        if (isRead !== undefined) {
            filter.isRead = isRead === "true" || isRead === true;
        }

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

        const totalNotifications = await Notification.countDocuments(filter);
        const unreadCount = await Notification.countDocuments({
            user: req.user.userId,
            isRead: false,
        });

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .lean();

        return res.status(200).json({
            success: true,
            count: notifications.length,
            unreadCount,
            pagination: {
                currentPage: pageNumber,
                limit: limitNumber,
                totalNotifications,
                totalPages: Math.ceil(totalNotifications / limitNumber),
            },
            notifications: notifications.map((n) => ({
                id: n._id,
                title: n.title,
                message: n.message,
                type: n.type,
                isRead: n.isRead,
                createdAt: n.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get notifications error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// MARK SINGLE NOTIFICATION AS READ
// =========================
export const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID",
            });
        }

        const notification = await Notification.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        notification.isRead = true;
        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification: {
                id: notification._id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                isRead: notification.isRead,
                createdAt: notification.createdAt,
            },
        });
    } catch (error) {
        console.error("Mark notification read error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// MARK ALL NOTIFICATIONS AS READ
// =========================
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                user: req.user.userId,
                isRead: false,
            },
            {
                $set: { isRead: true },
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            updatedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Mark all notifications read error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// DELETE NOTIFICATION
// =========================
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification ID",
            });
        }

        const notification = await Notification.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        await Notification.deleteOne({
            _id: id,
            user: req.user.userId,
        });

        return res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
        });
    } catch (error) {
        console.error("Delete notification error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};