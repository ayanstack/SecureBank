import express from "express";
import {
    getMySessions,
    revokeSession,
    revokeAllOtherSessions,
} from "../controllers/sessionController.mjs";
import protect from "../middleware/authMiddleware.mjs";
import validateRequest from "../middleware/validate.mjs";

const router = express.Router();

const validateSessionId = validateRequest({
    params: {
        id: {
            required: true,
            type: "objectId",
        },
    },
});

router.get("/", protect, getMySessions);
router.delete("/others", protect, revokeAllOtherSessions);
router.delete("/:id", protect, validateSessionId, revokeSession);

export default router;