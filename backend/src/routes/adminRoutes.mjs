import express from "express";
import {
    listUsers,
    getUserById,
    deactivateUser,
    reactivateUser,
    purgeExpiredSessions,
    listFraudAlerts,
    reviewFraudAlert,
    listAuditLogs,
} from "../controllers/adminController.mjs";
import protect from "../middleware/authMiddleware.mjs";
import restrictTo from "../middleware/roleMiddleware.mjs";
import { ROLES } from "../constants/index.mjs";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect);
router.use(restrictTo(ROLES.ADMIN, ROLES.SUPER_ADMIN));

// GET /admin/users - list users with filters & pagination
router.get("/users", listUsers);
// GET /admin/users/:id - get detailed user info
router.get("/users/:id", getUserById);
// PATCH /admin/users/:id/deactivate - deactivate a user
router.patch("/users/:id/deactivate", deactivateUser);
// PATCH /admin/users/:id/reactivate - reactivate a user
router.patch("/users/:id/reactivate", reactivateUser);
// DELETE /admin/sessions/purge - purge expired/revoked sessions
router.delete("/sessions/purge", purgeExpiredSessions);

// Fraud monitoring & Suspicious Activity
router.get("/fraud-alerts", listFraudAlerts);
router.patch("/fraud-alerts/:id", reviewFraudAlert);

// Audit logs
router.get("/audit-logs", listAuditLogs);

export default router;

