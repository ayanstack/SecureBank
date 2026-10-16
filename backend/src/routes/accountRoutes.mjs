import express from "express";
import protect from "../middleware/authMiddleware.mjs";
import {
    createAccount,
    getMyAccounts,
    getAccountById,
    freezeAccount,
    unfreezeAccount,
    closeAccount,
    setPrimaryAccount,
} from "../controllers/accountController.mjs";
import {
    validateCreateAccount,
    validateAccountIdParam,
} from "../validators/accountValidators.mjs";

const router = express.Router();

// Create bank account
router.post("/", protect, validateCreateAccount, createAccount);

// Get my accounts
router.get("/", protect, getMyAccounts);

// Get single account
router.get("/:id", protect, validateAccountIdParam, getAccountById);
router.patch("/:id/freeze", protect, validateAccountIdParam, freezeAccount);
router.patch("/:id/unfreeze", protect, validateAccountIdParam, unfreezeAccount);
router.patch("/:id/close", protect, validateAccountIdParam, closeAccount);
router.patch("/:id/primary", protect, validateAccountIdParam, setPrimaryAccount);

export default router;