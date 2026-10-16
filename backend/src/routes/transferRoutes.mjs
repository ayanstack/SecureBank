import express from "express";
import protect from "../middleware/authMiddleware.mjs";
import {
    createTransfer,
    getTransferById,
    reverseTransfer,
} from "../controllers/transferController.mjs";
import {
    validateCreateTransfer,
    validateTransferIdParam,
} from "../validators/transferValidators.mjs";

const router = express.Router();

router.post("/", protect, validateCreateTransfer, createTransfer);
router.get("/:id", protect, validateTransferIdParam, getTransferById);
router.patch("/:id/reverse", protect, validateTransferIdParam, reverseTransfer);

export default router;