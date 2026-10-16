import mongoose from "mongoose";
import Account from "../models/Account.mjs";
import { ACCOUNT_TYPES, ACCOUNT_STATUS } from "../constants/index.mjs";
import { roundMoney } from "../utils/money.mjs";

// Helper to generate a unique bank account number
const generateAccountNumber = async () => {
    let accountNumber;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
        attempts++;
        const randomPart = Math.floor(1000000000 + Math.random() * 9000000000);
        accountNumber = `SB${randomPart}`;
        const existing = await Account.findOne({ accountNumber });
        if (!existing) {
            exists = false;
        }
    }

    if (exists) {
        accountNumber = `SB${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    }

    return accountNumber;
};

// =========================
// CREATE BANK ACCOUNT
// =========================
export const createAccount = async (req, res) => {
    try {
        const { accountType } = req.body;

        if (!accountType || !Object.values(ACCOUNT_TYPES).includes(accountType)) {
            return res.status(400).json({
                success: false,
                message: `Account type must be one of: ${Object.values(ACCOUNT_TYPES).join(", ")}`,
            });
        }

        const existingAccount = await Account.findOne({
            user: req.user.userId,
            accountType,
            status: { $ne: ACCOUNT_STATUS.CLOSED },
        });

        if (existingAccount) {
            return res.status(409).json({
                success: false,
                message: `An active ${accountType} account already exists`,
            });
        }

        const accountNumber = await generateAccountNumber();

        // Check if user has any existing accounts; if not, make this primary
        const userAccountCount = await Account.countDocuments({
            user: req.user.userId,
            status: { $ne: ACCOUNT_STATUS.CLOSED },
        });

        const account = await Account.create({
            user: req.user.userId,
            accountNumber,
            accountType,
            ifscCode: "SECB0000001",
            balance: 0,
            status: ACCOUNT_STATUS.ACTIVE,
            isPrimary: userAccountCount === 0,
        });

        return res.status(201).json({
            success: true,
            message: "Bank account created successfully",
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                ifscCode: account.ifscCode,
                balance: roundMoney(account.balance),
                status: account.status,
                isPrimary: account.isPrimary,
                createdAt: account.createdAt,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Account number collision occurred. Please try again.",
            });
        }

        console.error("Create account error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// GET MY ACCOUNTS
// =========================
export const getMyAccounts = async (req, res) => {
    try {
        const { status, accountType } = req.query;

        const filter = {
            user: req.user.userId,
        };

        if (status && Object.values(ACCOUNT_STATUS).includes(status.toUpperCase())) {
            filter.status = status.toUpperCase();
        } else {
            filter.status = { $ne: ACCOUNT_STATUS.CLOSED };
        }

        if (accountType && Object.values(ACCOUNT_TYPES).includes(accountType.toUpperCase())) {
            filter.accountType = accountType.toUpperCase();
        }

        const accounts = await Account.find(filter)
            .select("accountNumber accountType ifscCode balance status isPrimary createdAt updatedAt")
            .sort({ isPrimary: -1, createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: accounts.length,
            accounts: accounts.map((acc) => ({
                id: acc._id,
                accountNumber: acc.accountNumber,
                accountType: acc.accountType,
                ifscCode: acc.ifscCode,
                balance: roundMoney(acc.balance),
                status: acc.status,
                isPrimary: acc.isPrimary,
                createdAt: acc.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get accounts error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// GET SINGLE ACCOUNT
// =========================
export const getAccountById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID",
            });
        }

        const account = await Account.findOne({
            _id: id,
            user: req.user.userId,
        }).select("accountNumber accountType ifscCode balance status isPrimary createdAt updatedAt");

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        return res.status(200).json({
            success: true,
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                ifscCode: account.ifscCode,
                balance: roundMoney(account.balance),
                status: account.status,
                isPrimary: account.isPrimary,
                createdAt: account.createdAt,
                updatedAt: account.updatedAt,
            },
        });
    } catch (error) {
        console.error("Get account error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// FREEZE BANK ACCOUNT
// =========================
export const freezeAccount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID",
            });
        }

        const account = await Account.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (account.status === ACCOUNT_STATUS.CLOSED) {
            return res.status(400).json({
                success: false,
                message: "Closed account cannot be frozen",
            });
        }

        if (account.status === ACCOUNT_STATUS.FROZEN) {
            return res.status(400).json({
                success: false,
                message: "Account is already frozen",
            });
        }

        account.status = ACCOUNT_STATUS.FROZEN;
        await account.save();

        return res.status(200).json({
            success: true,
            message: "Account frozen successfully",
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                status: account.status,
            },
        });
    } catch (error) {
        console.error("Freeze account error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// UNFREEZE BANK ACCOUNT
// =========================
export const unfreezeAccount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID",
            });
        }

        const account = await Account.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (account.status === ACCOUNT_STATUS.CLOSED) {
            return res.status(400).json({
                success: false,
                message: "Closed account cannot be unfrozen",
            });
        }

        if (account.status === ACCOUNT_STATUS.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: "Account is already active",
            });
        }

        account.status = ACCOUNT_STATUS.ACTIVE;
        await account.save();

        return res.status(200).json({
            success: true,
            message: "Account unfrozen successfully",
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                status: account.status,
            },
        });
    } catch (error) {
        console.error("Unfreeze account error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// CLOSE BANK ACCOUNT
// =========================
export const closeAccount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID",
            });
        }

        const account = await Account.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (account.status === ACCOUNT_STATUS.CLOSED) {
            return res.status(400).json({
                success: false,
                message: "Account is already closed",
            });
        }

        if (account.balance > 0) {
            return res.status(400).json({
                success: false,
                message: "Account with positive balance cannot be closed. Please transfer or withdraw all funds first.",
            });
        }

        account.status = ACCOUNT_STATUS.CLOSED;
        account.isPrimary = false;
        await account.save();

        return res.status(200).json({
            success: true,
            message: "Account closed successfully",
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                status: account.status,
            },
        });
    } catch (error) {
        console.error("Close account error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// SET PRIMARY ACCOUNT
// =========================
export const setPrimaryAccount = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID",
            });
        }

        const account = await Account.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (account.status === ACCOUNT_STATUS.CLOSED) {
            return res.status(400).json({
                success: false,
                message: "Closed account cannot be set as primary",
            });
        }

        if (account.status === ACCOUNT_STATUS.FROZEN) {
            return res.status(400).json({
                success: false,
                message: "Frozen account cannot be set as primary",
            });
        }

        // Unset primary on other accounts of the user
        await Account.updateMany(
            {
                user: req.user.userId,
                _id: { $ne: id },
            },
            {
                $set: { isPrimary: false },
            }
        );

        account.isPrimary = true;
        await account.save();

        return res.status(200).json({
            success: true,
            message: "Primary account updated successfully",
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                isPrimary: account.isPrimary,
            },
        });
    } catch (error) {
        console.error("Set primary account error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};