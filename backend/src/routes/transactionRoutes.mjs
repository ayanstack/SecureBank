import express from "express";
import protect from "../middleware/authMiddleware.mjs";
import {
    depositMoney,
    withdrawMoney,
    getTransactionHistory,
    getTransactionById,
} from "../controllers/transactionController.mjs";
import {
    validateDeposit,
    validateWithdraw,
    validateTransactionHistory,
    validateTransactionIdParam,
} from "../validators/transactionValidators.mjs";

const router = express.Router();

router.post("/deposit", protect, validateDeposit, depositMoney);
router.post("/withdraw", protect, validateWithdraw, withdrawMoney);
router.get("/history/:accountId", protect, validateTransactionHistory, getTransactionHistory);
router.get("/:id", protect, validateTransactionIdParam, getTransactionById);

export default router;