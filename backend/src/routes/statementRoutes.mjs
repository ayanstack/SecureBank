import express from "express";
import rateLimit from "express-rate-limit";
import protect from "../middleware/authMiddleware.mjs";
import {
    getAccountStatement,
    getStatementSummary,
    getMiniStatement,
    downloadStatementCSV,
    downloadStatementPDF,
    emailAccountStatement,
    getMonthlyStatement,
} from "../controllers/statementController.mjs";
import {
    validateAccountIdParam,
    validateEmailStatement,
    validateMonthlyStatement,
    validateStatementQuery,
} from "../validators/statementValidators.mjs";

const router = express.Router();

// Strict rate limit for emailing statements to protect SMTP server
const emailStatementLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many statement email requests. Please try again later.",
    },
});

// Mini statement: latest 5 transactions
router.get("/:accountId/mini", protect, validateAccountIdParam, getMiniStatement);

// Statement summary
router.get("/:accountId/summary", protect, validateAccountIdParam, getStatementSummary);

// Monthly statement
router.get("/:accountId/monthly", protect, validateMonthlyStatement, getMonthlyStatement);

// CSV Statement
router.get("/:accountId/download/csv", protect, validateAccountIdParam, downloadStatementCSV);

// PDF Statement
router.get("/:accountId/download/pdf", protect, validateAccountIdParam, downloadStatementPDF);

// Email Statement
router.post("/:accountId/email", protect, emailStatementLimiter, validateEmailStatement, emailAccountStatement);

// Full account statement
router.get("/:accountId", protect, validateStatementQuery, getAccountStatement);

export default router;
