import mongoose from "mongoose";
import Account from "../models/Account.mjs";
import Transaction from "../models/Transaction.mjs";
import { createNotification } from "../services/notificationService.mjs";
import {
    roundMoney,
    addMoney,
    subtractMoney,
    isValidAmount,
} from "../utils/money.mjs";
import {
    ACCOUNT_STATUS,
    TRANSACTION_TYPES,
    TRANSACTION_STATUS,
    LIMITS,
} from "../constants/index.mjs";

// =========================
// DEPOSIT MONEY
// =========================
export const depositMoney = async (req, res) => {
    try {
        const { accountId, amount, description } = req.body;

        if (!accountId || !isValidAmount(amount, LIMITS.MIN_TRANSACTION_AMOUNT, LIMITS.MAX_TRANSACTION_AMOUNT)) {
            return res.status(400).json({
                success: false,
                message: `Valid account ID and positive amount between ₹${LIMITS.MIN_TRANSACTION_AMOUNT} and ₹${LIMITS.MAX_TRANSACTION_AMOUNT} are required`,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID",
            });
        }

        const depositAmount = roundMoney(amount);

        // Fetch current account state and verify ownership
        const account = await Account.findOne({
            _id: accountId,
            user: req.user.userId,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (account.status !== ACCOUNT_STATUS.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: `Cannot deposit into an account with status ${account.status}`,
            });
        }

        const balanceBefore = roundMoney(account.balance);
        const balanceAfter = addMoney(balanceBefore, depositAmount);

        // Atomic update of account balance
        const updatedAccount = await Account.findOneAndUpdate(
            {
                _id: accountId,
                user: req.user.userId,
                status: ACCOUNT_STATUS.ACTIVE,
            },
            {
                $inc: { balance: depositAmount },
            },
            { returnDocument: "after" }
        );

        if (!updatedAccount) {
            return res.status(400).json({
                success: false,
                message: "Account status changed or account unavailable",
            });
        }

        let transaction;
        const reference = `DEP${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

        try {
            transaction = await Transaction.create({
                account: account._id,
                user: req.user.userId,
                type: TRANSACTION_TYPES.DEPOSIT,
                amount: depositAmount,
                balanceBefore,
                balanceAfter: roundMoney(updatedAccount.balance),
                status: TRANSACTION_STATUS.SUCCESS,
                reference,
                description: description ? description.trim() : "Cash deposit",
            });
        } catch (txError) {
            // Revert balance increment if transaction record fails
            await Account.findByIdAndUpdate(accountId, {
                $inc: { balance: -depositAmount },
            });
            throw txError;
        }

        // Notification (non-blocking)
        createNotification({
            userId: req.user.userId,
            title: "Deposit Successful",
            message: `₹${depositAmount.toFixed(2)} deposited into account ending ${account.accountNumber.slice(-4)}.`,
            type: "TRANSACTION",
        }).catch((err) => console.error("Deposit notification error:", err.message));

        return res.status(201).json({
            success: true,
            message: "Money deposited successfully",
            transaction: {
                id: transaction._id,
                type: transaction.type,
                amount: transaction.amount,
                balanceBefore: transaction.balanceBefore,
                balanceAfter: transaction.balanceAfter,
                status: transaction.status,
                reference: transaction.reference,
                description: transaction.description,
                createdAt: transaction.createdAt,
            },
        });
    } catch (error) {
        console.error("Deposit money error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to process deposit",
        });
    }
};

// =========================
// WITHDRAW MONEY
// =========================
export const withdrawMoney = async (req, res) => {
    try {
        const { accountId, amount, description } = req.body;

        if (!accountId || !isValidAmount(amount, LIMITS.MIN_TRANSACTION_AMOUNT, LIMITS.MAX_TRANSACTION_AMOUNT)) {
            return res.status(400).json({
                success: false,
                message: `Valid account ID and positive amount between ₹${LIMITS.MIN_TRANSACTION_AMOUNT} and ₹${LIMITS.MAX_TRANSACTION_AMOUNT} are required`,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID",
            });
        }

        const withdrawalAmount = roundMoney(amount);

        // Fetch account to verify ownership and initial balance check
        const account = await Account.findOne({
            _id: accountId,
            user: req.user.userId,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        if (account.status !== ACCOUNT_STATUS.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: `Cannot withdraw from an account with status ${account.status}`,
            });
        }

        if (withdrawalAmount > account.balance) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance",
            });
        }

        const balanceBefore = roundMoney(account.balance);

        // ATOMIC withdrawal check and decrement in DB to prevent concurrent race conditions
        const updatedAccount = await Account.findOneAndUpdate(
            {
                _id: accountId,
                user: req.user.userId,
                status: ACCOUNT_STATUS.ACTIVE,
                balance: { $gte: withdrawalAmount },
            },
            {
                $inc: { balance: -withdrawalAmount },
            },
            { returnDocument: "after" }
        );

        if (!updatedAccount) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance or account status changed during transaction",
            });
        }

        let transaction;
        const reference = `WDR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

        try {
            transaction = await Transaction.create({
                account: account._id,
                user: req.user.userId,
                type: TRANSACTION_TYPES.WITHDRAW,
                amount: withdrawalAmount,
                balanceBefore,
                balanceAfter: roundMoney(updatedAccount.balance),
                status: TRANSACTION_STATUS.SUCCESS,
                reference,
                description: description ? description.trim() : "Cash withdrawal",
            });
        } catch (txError) {
            // Revert balance deduction if transaction record fails
            await Account.findByIdAndUpdate(accountId, {
                $inc: { balance: withdrawalAmount },
            });
            throw txError;
        }

        // Notification (non-blocking)
        createNotification({
            userId: req.user.userId,
            title: "Withdrawal Successful",
            message: `₹${withdrawalAmount.toFixed(2)} withdrawn from account ending ${account.accountNumber.slice(-4)}.`,
            type: "TRANSACTION",
        }).catch((err) => console.error("Withdrawal notification error:", err.message));

        return res.status(201).json({
            success: true,
            message: "Money withdrawn successfully",
            transaction: {
                id: transaction._id,
                type: transaction.type,
                amount: transaction.amount,
                balanceBefore: transaction.balanceBefore,
                balanceAfter: transaction.balanceAfter,
                status: transaction.status,
                reference: transaction.reference,
                description: transaction.description,
                createdAt: transaction.createdAt,
            },
        });
    } catch (error) {
        console.error("Withdraw money error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to process withdrawal",
        });
    }
};

// =========================
// GET TRANSACTION HISTORY
// =========================
export const getTransactionHistory = async (req, res) => {
    try {
        const { accountId } = req.params;
        const {
            type,
            status,
            startDate,
            endDate,
            page = 1,
            limit = 10,
        } = req.query;

        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account ID",
            });
        }

        // Verify account ownership
        const account = await Account.findOne({
            _id: accountId,
            user: req.user.userId,
        });

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        const normalizedType = type?.toUpperCase();
        const normalizedStatus = status?.toUpperCase();

        if (normalizedType && !Object.values(TRANSACTION_TYPES).includes(normalizedType)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction type",
            });
        }

        if (normalizedStatus && !Object.values(TRANSACTION_STATUS).includes(normalizedStatus)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction status",
            });
        }

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

        const query = {
            account: accountId,
            user: req.user.userId,
        };

        if (normalizedType) query.type = normalizedType;
        if (normalizedStatus) query.status = normalizedStatus;

        if (startDate || endDate) {
            query.createdAt = {};

            if (startDate) {
                const start = new Date(startDate);
                if (Number.isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid startDate",
                    });
                }
                start.setHours(0, 0, 0, 0);
                query.createdAt.$gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);
                if (Number.isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid endDate",
                    });
                }
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }

            if (
                query.createdAt.$gte &&
                query.createdAt.$lte &&
                query.createdAt.$gte > query.createdAt.$lte
            ) {
                return res.status(400).json({
                    success: false,
                    message: "startDate must not be after endDate",
                });
            }
        }

        const totalTransactions = await Transaction.countDocuments(query);

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .select("account type amount balanceBefore balanceAfter status reference description createdAt")
            .lean();

        const totalPages = Math.ceil(totalTransactions / limitNumber);

        return res.status(200).json({
            success: true,
            filters: {
                type: normalizedType || null,
                status: normalizedStatus || null,
                startDate: startDate || null,
                endDate: endDate || null,
            },
            pagination: {
                currentPage: pageNumber,
                limit: limitNumber,
                totalTransactions,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1,
            },
            count: transactions.length,
            transactions: transactions.map((t) => ({
                id: t._id,
                account: t.account,
                type: t.type,
                amount: roundMoney(t.amount),
                balanceBefore: roundMoney(t.balanceBefore),
                balanceAfter: roundMoney(t.balanceAfter),
                status: t.status,
                reference: t.reference,
                description: t.description,
                createdAt: t.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get transaction history error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch transaction history",
        });
    }
};

// =========================
// GET SINGLE TRANSACTION
// =========================
export const getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction ID",
            });
        }

        const transaction = await Transaction.findOne({
            _id: id,
            user: req.user.userId,
        }).select("account type amount balanceBefore balanceAfter status reference description createdAt");

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        return res.status(200).json({
            success: true,
            transaction: {
                id: transaction._id,
                account: transaction.account,
                type: transaction.type,
                amount: roundMoney(transaction.amount),
                balanceBefore: roundMoney(transaction.balanceBefore),
                balanceAfter: roundMoney(transaction.balanceAfter),
                status: transaction.status,
                reference: transaction.reference,
                description: transaction.description,
                createdAt: transaction.createdAt,
            },
        });
    } catch (error) {
        console.error("Get transaction error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch transaction",
        });
    }
};