import express from "express";
import protect from "../middleware/authMiddleware.mjs";
import {
    getMyNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
} from "../controllers/notificationController.mjs";
import validateRequest from "../middleware/validate.mjs";

const router = express.Router();

const validateNotificationId = validateRequest({
    params: {
        id: {
            required: true,
            type: "objectId",
        },
    },
});

router.get("/", protect, getMyNotifications);
router.patch("/read-all", protect, markAllNotificationsAsRead);
router.patch("/:id/read", protect, validateNotificationId, markNotificationAsRead);
router.delete("/:id", protect, validateNotificationId, deleteNotification);

export default router;