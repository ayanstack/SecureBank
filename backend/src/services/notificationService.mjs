import Notification from "../models/Notification.mjs";
import { getIO } from "../config/socket.mjs";

export const createNotification = async ({
    userId,
    title,
    message,
    type,
}) => {
    try {
        const notification = await Notification.create({
            user: userId,
            title,
            message,
            type,
        });

        try {
            const io = getIO();
            if (io) {
                io.to(userId.toString()).emit("notification", notification);
            }
        } catch {
            // Socket.IO may not be initialized in background workers or tests
        }

        return notification;
    } catch (error) {
        console.error("Create notification error:", error.message);
        return null;
    }
};

export default createNotification;