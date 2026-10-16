import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.mjs";
import Account from "../models/Account.mjs";
import Beneficiary from "../models/Beneficiary.mjs";
import Transfer from "../models/Transfer.mjs";
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
    BENEFICIARY_STATUS,
    TRANSACTION_TYPES,
    TRANSACTION_STATUS,
    LIMITS,
} from "../constants/index.mjs";
import { evaluateTransactionRisk, logAuditEvent } from "../services/fraudService.mjs";

const DAILY_TRANSFER_LIMIT = LIMITS.DAILY_TRANSFER_LIMIT;

// =========================
// CREATE TRANSFER
// =========================
export const createTransfer = async (req, res) => {
    try {
        const {
            senderAccountId,
            beneficiaryId,
            amount,
            transactionPin,
            description,
        } = req.body;

        // Idempotency key from header or body
        const idempotencyKey =
            req.headers["idempotency-key"] ||
            req.headers["x-idempotency-key"] ||
            req.body.idempotencyKey;

        // Check idempotency first if key provided
        if (idempotencyKey && senderAccountId && mongoose.Types.ObjectId.isValid(senderAccountId)) {
            const existingTransfer = await Transfer.findOne({
                senderAccount: senderAccountId,
                idempotencyKey,
            });

            if (existingTransfer) {
                return res.status(200).json({
                    success: true,
                    message: "Transfer already processed (idempotent replay)",
                    transfer: {
                        id: existingTransfer._id,
                        reference: existingTransfer.reference,
                        senderAccountId: existingTransfer.senderAccount,
                        receiverAccountId: existingTransfer.receiverAccount,
                        amount: roundMoney(existingTransfer.amount),
                        status: existingTransfer.status,
                        description: existingTransfer.description,
                        isIdempotentReplay: true,
                    },
                });
            }
        }

        // Validate transaction PIN format
        if (!transactionPin || !/^\d{4}$/.test(transactionPin)) {
            return res.status(400).json({
                success: false,
                message: "Valid 4-digit transaction PIN is required",
            });
        }

        // Validate basic fields
        if (!senderAccountId || !beneficiaryId || !isValidAmount(amount, 1, DAILY_TRANSFER_LIMIT)) {
            return res.status(400).json({
                success: false,
                message: `Sender account, beneficiary, and positive amount between ₹1 and ₹${DAILY_TRANSFER_LIMIT} are required`,
            });
        }

        const transferAmount = roundMoney(amount);

        // Verify user and transaction PIN
        const user = await User.findById(req.user.userId).select(
            "+transactionPin +pinAttempts +pinLockUntil"
        );

        if (!user || !user.isTransactionPinSet || !user.transactionPin) {
            return res.status(400).json({
                success: false,
                message: "Transaction PIN is not set. Please set a transaction PIN first.",
            });
        }

        if (user.isPinLocked()) {
            return res.status(423).json({
                success: false,
                message: "Transaction PIN is temporarily locked due to repeated failed attempts.",
            });
        }

        const isPinCorrect = await bcrypt.compare(transactionPin, user.transactionPin);

        if (!isPinCorrect) {
            user.pinAttempts = (user.pinAttempts || 0) + 1;
            if (user.pinAttempts >= LIMITS.MAX_PIN_ATTEMPTS) {
                user.pinLockUntil = new Date(Date.now() + LIMITS.PIN_LOCKOUT_MS);
            }
            await user.save();

            const attemptsRemaining = Math.max(0, LIMITS.MAX_PIN_ATTEMPTS - user.pinAttempts);
            return res.status(401).json({
                success: false,
                message: "Invalid transaction PIN",
                attemptsRemaining,
            });
        }

        // Reset pin attempts on successful entry
        if (user.pinAttempts > 0) {
            user.pinAttempts = 0;
            await user.save();
        }

        // Verify sender account ownership & status
        const senderAccount = await Account.findOne({
            _id: senderAccountId,
            user: req.user.userId,
        });

        if (!senderAccount) {
            return res.status(404).json({
                success: false,
                message: "Sender account not found",
            });
        }

        if (senderAccount.status !== ACCOUNT_STATUS.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: `Sender account is ${senderAccount.status.toLowerCase()}`,
            });
        }

        // Verify beneficiary ownership & status
        const beneficiary = await Beneficiary.findOne({
            _id: beneficiaryId,
            user: req.user.userId,
        });

        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: "Beneficiary not found",
            });
        }

        if (beneficiary.status !== BENEFICIARY_STATUS.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: "Beneficiary is not active",
            });
        }

        // Verify receiver account exists and is active
        const receiverAccount = await Account.findOne({
            accountNumber: beneficiary.accountNumber,
            status: ACCOUNT_STATUS.ACTIVE,
        });

        if (!receiverAccount) {
            return res.status(404).json({
                success: false,
                message: "Receiver account not found or is currently inactive",
            });
        }

        // Prevent self-transfer
        if (receiverAccount._id.toString() === senderAccount._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Sender and receiver account cannot be the same",
            });
        }

        // Daily transfer limit check
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const todayTransfers = await Transfer.find({
            senderAccount: senderAccount._id,
            status: TRANSACTION_STATUS.SUCCESS,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay,
            },
        });

        const transferredToday = todayTransfers.reduce(
            (total, tx) => addMoney(total, tx.amount),
            0
        );

        if (addMoney(transferredToday, transferAmount) > DAILY_TRANSFER_LIMIT) {
            return res.status(400).json({
                success: false,
                message: `Daily transfer limit of ₹${DAILY_TRANSFER_LIMIT} exceeded`,
                dailyLimit: DAILY_TRANSFER_LIMIT,
                transferredToday,
                remainingLimit: Math.max(0, subtractMoney(DAILY_TRANSFER_LIMIT, transferredToday)),
            });
        }

        // Check sufficient balance
        if (transferAmount > senderAccount.balance) {
            return res.status(400).json({
                success: false,
                message: "Insufficient balance",
            });
        }

        const transferReference = `TRF${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

        // Execute transfer with transactions if supported by MongoDB replica set
        let session = null;
        let useTransactions = false;

        try {
            session = await mongoose.startSession();
            session.startTransaction();
            useTransactions = true;
        } catch {
            // Standalone MongoDB does not support multi-document transactions.
            // Safe fallback: 2-phase atomic updates with condition checks.
            useTransactions = false;
            if (session) {
                await session.endSession();
                session = null;
            }
        }

        if (useTransactions && session) {
            try {
                // Sender balance before
                const senderBalanceBefore = roundMoney(senderAccount.balance);
                const receiverBalanceBefore = roundMoney(receiverAccount.balance);

                // Atomic debit from sender with balance check
                const debitedSender = await Account.findOneAndUpdate(
                    {
                        _id: senderAccount._id,
                        balance: { $gte: transferAmount },
                    },
                    {
                        $inc: { balance: -transferAmount },
                    },
                    { session, returnDocument: "after" }
                );

                if (!debitedSender) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({
                        success: false,
                        message: "Insufficient balance during transaction execution",
                    });
                }

                // Credit receiver
                const creditedReceiver = await Account.findOneAndUpdate(
                    {
                        _id: receiverAccount._id,
                    },
                    {
                        $inc: { balance: transferAmount },
                    },
                    { session, returnDocument: "after" }
                );

                if (!creditedReceiver) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({
                        success: false,
                        message: "Receiver account unavailable",
                    });
                }

                // Create Transfer record
                const [transfer] = await Transfer.create(
                    [
                        {
                            senderAccount: senderAccount._id,
                            beneficiary: beneficiary._id,
                            receiverAccount: receiverAccount._id,
                            amount: transferAmount,
                            status: TRANSACTION_STATUS.SUCCESS,
                            reference: transferReference,
                            idempotencyKey: idempotencyKey || null,
                            description: description ? description.trim() : "Bank transfer",
                        },
                    ],
                    { session }
                );

                // Sender Debit Transaction
                await Transaction.create(
                    [
                        {
                            account: senderAccount._id,
                            user: req.user.userId,
                            type: TRANSACTION_TYPES.TRANSFER,
                            amount: transferAmount,
                            balanceBefore: senderBalanceBefore,
                            balanceAfter: roundMoney(debitedSender.balance),
                            status: TRANSACTION_STATUS.SUCCESS,
                            reference: `${transferReference}-DR`,
                            description: description ? description.trim() : `Transfer to ${beneficiary.name}`,
                        },
                    ],
                    { session }
                );

                // Receiver Credit Transaction
                await Transaction.create(
                    [
                        {
                            account: receiverAccount._id,
                            user: receiverAccount.user,
                            type: TRANSACTION_TYPES.TRANSFER,
                            amount: transferAmount,
                            balanceBefore: receiverBalanceBefore,
                            balanceAfter: roundMoney(creditedReceiver.balance),
                            status: TRANSACTION_STATUS.SUCCESS,
                            reference: `${transferReference}-CR`,
                            description: description ? description.trim() : `Transfer from ${user.firstName} ${user.lastName}`,
                        },
                    ],
                    { session }
                );

                await session.commitTransaction();
                session.endSession();

                // Send notifications (non-blocking)
                createNotification({
                    userId: req.user.userId,
                    title: "Transfer Sent",
                    message: `₹${transferAmount.toFixed(2)} sent to ${beneficiary.name}.`,
                    type: "TRANSFER",
                }).catch((e) => console.error(e.message));

                createNotification({
                    userId: receiverAccount.user,
                    title: "Money Received",
                    message: `₹${transferAmount.toFixed(2)} received into account ending ${receiverAccount.accountNumber.slice(-4)}.`,
                    type: "TRANSFER",
                }).catch((e) => console.error(e.message));

                return res.status(200).json({
                    success: true,
                    message: "Transfer successful",
                    transfer: {
                        id: transfer._id,
                        reference: transferReference,
                        senderAccountId: senderAccount._id,
                        receiverAccountId: receiverAccount._id,
                        amount: transferAmount,
                        status: TRANSACTION_STATUS.SUCCESS,
                        description: transfer.description,
                    },
                });
            } catch (txError) {
                await session.abortTransaction();
                session.endSession();

                console.error("Transfer transaction error:", txError.message);
                return res.status(500).json({
                    success: false,
                    message: "Transfer failed to process",
                });
            }
        } else {
            // Standalone fallback: Atomic 2-phase conditional update
            const senderBalanceBefore = roundMoney(senderAccount.balance);
            const receiverBalanceBefore = roundMoney(receiverAccount.balance);

            const debitedSender = await Account.findOneAndUpdate(
                {
                    _id: senderAccount._id,
                    balance: { $gte: transferAmount },
                },
                {
                    $inc: { balance: -transferAmount },
                },
                { returnDocument: "after" }
            );

            if (!debitedSender) {
                return res.status(400).json({
                    success: false,
                    message: "Insufficient balance",
                });
            }

            try {
                const creditedReceiver = await Account.findByIdAndUpdate(
                    receiverAccount._id,
                    {
                        $inc: { balance: transferAmount },
                    },
                    { returnDocument: "after" }
                );

                if (!creditedReceiver) {
                    // Revert sender balance immediately
                    await Account.findByIdAndUpdate(senderAccount._id, {
                        $inc: { balance: transferAmount },
                    });
                    return res.status(400).json({
                        success: false,
                        message: "Receiver account unavailable",
                    });
                }

                const transfer = await Transfer.create({
                    senderAccount: senderAccount._id,
                    beneficiary: beneficiary._id,
                    receiverAccount: receiverAccount._id,
                    amount: transferAmount,
                    status: TRANSACTION_STATUS.SUCCESS,
                    reference: transferReference,
                    idempotencyKey: idempotencyKey || null,
                    description: description ? description.trim() : "Bank transfer",
                });

                await Transaction.create({
                    account: senderAccount._id,
                    user: req.user.userId,
                    type: TRANSACTION_TYPES.TRANSFER,
                    amount: transferAmount,
                    balanceBefore: senderBalanceBefore,
                    balanceAfter: roundMoney(debitedSender.balance),
                    status: TRANSACTION_STATUS.SUCCESS,
                    reference: `${transferReference}-DR`,
                    description: description ? description.trim() : `Transfer to ${beneficiary.name}`,
                });

                await Transaction.create({
                    account: receiverAccount._id,
                    user: receiverAccount.user,
                    type: TRANSACTION_TYPES.TRANSFER,
                    amount: transferAmount,
                    balanceBefore: receiverBalanceBefore,
                    balanceAfter: roundMoney(creditedReceiver.balance),
                    status: TRANSACTION_STATUS.SUCCESS,
                    reference: `${transferReference}-CR`,
                    description: description ? description.trim() : `Transfer from ${user.firstName} ${user.lastName}`,
                });

                // Rule-based fraud risk evaluation (asynchronous)
                evaluateTransactionRisk({
                    userId: user._id,
                    accountId: senderAccount._id,
                    amount: transferAmount,
                    type: "TRANSFER",
                }).catch((e) => console.error("[RiskEvaluation Error]:", e.message));

                // Audit log event
                logAuditEvent({
                    user: user._id,
                    action: "FUNDS_TRANSFER",
                    resource: "Transfer",
                    resourceId: String(transfer._id),
                    ipAddress: req.ip,
                    userAgent: req.headers["user-agent"],
                    details: { amount: transferAmount, reference: transferReference },
                }).catch(() => {});

                return res.status(200).json({
                    success: true,
                    message: "Transfer successful",
                    transfer: {
                        id: transfer._id,
                        reference: transferReference,
                        senderAccountId: senderAccount._id,
                        receiverAccountId: receiverAccount._id,
                        amount: transferAmount,
                        status: TRANSACTION_STATUS.SUCCESS,
                        description: transfer.description,
                    },
                });
            } catch (standaloneError) {
                // Revert sender balance on failure
                await Account.findByIdAndUpdate(senderAccount._id, {
                    $inc: { balance: transferAmount },
                });
                throw standaloneError;
            }
        }
    } catch (error) {
        console.error("Create transfer error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// GET TRANSFER DETAILS
// =========================
export const getTransferById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer ID",
            });
        }

        const transfer = await Transfer.findById(id)
            .populate("senderAccount", "accountNumber accountType ifscCode user")
            .populate("receiverAccount", "accountNumber accountType ifscCode user")
            .populate("beneficiary", "name accountNumber ifscCode");

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found",
            });
        }

        // Ownership check: user must be sender or receiver
        const isSender = transfer.senderAccount?.user?.toString() === req.user.userId;
        const isReceiver = transfer.receiverAccount?.user?.toString() === req.user.userId;

        if (!isSender && !isReceiver) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this transfer",
            });
        }

        return res.status(200).json({
            success: true,
            transfer: {
                id: transfer._id,
                reference: transfer.reference,
                senderAccount: {
                    id: transfer.senderAccount._id,
                    accountNumber: transfer.senderAccount.accountNumber,
                    accountType: transfer.senderAccount.accountType,
                    ifscCode: transfer.senderAccount.ifscCode,
                },
                receiverAccount: {
                    id: transfer.receiverAccount._id,
                    accountNumber: transfer.receiverAccount.accountNumber,
                    accountType: transfer.receiverAccount.accountType,
                    ifscCode: transfer.receiverAccount.ifscCode,
                },
                beneficiary: transfer.beneficiary,
                amount: roundMoney(transfer.amount),
                status: transfer.status,
                description: transfer.description,
                createdAt: transfer.createdAt,
                updatedAt: transfer.updatedAt,
            },
        });
    } catch (error) {
        console.error("Get transfer error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// REVERSE TRANSFER
// =========================
export const reverseTransfer = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid transfer ID",
            });
        }

        const transfer = await Transfer.findById(id);

        if (!transfer) {
            return res.status(404).json({
                success: false,
                message: "Transfer not found",
            });
        }

        if (transfer.status !== TRANSACTION_STATUS.SUCCESS) {
            return res.status(400).json({
                success: false,
                message: `Only successful transfers can be reversed. Current status is ${transfer.status}`,
            });
        }

        // Check sender ownership
        const senderAccount = await Account.findOne({
            _id: transfer.senderAccount,
            user: req.user.userId,
        });

        if (!senderAccount) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to reverse this transfer",
            });
        }

        // Find receiver account
        const receiverAccount = await Account.findById(transfer.receiverAccount);

        if (!receiverAccount) {
            return res.status(404).json({
                success: false,
                message: "Receiver account not found",
            });
        }

        // Receiver must have sufficient balance to be deducted
        if (receiverAccount.balance < transfer.amount) {
            return res.status(400).json({
                success: false,
                message: "Receiver has insufficient balance for reversal",
            });
        }

        let session = null;
        let useTransactions = false;

        try {
            session = await mongoose.startSession();
            session.startTransaction();
            useTransactions = true;
        } catch {
            useTransactions = false;
            if (session) {
                await session.endSession();
                session = null;
            }
        }

        const reversalReference = `REV${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

        if (useTransactions && session) {
            try {
                const senderBalanceBefore = roundMoney(senderAccount.balance);
                const receiverBalanceBefore = roundMoney(receiverAccount.balance);

                // Deduct from receiver atomically
                const debitedReceiver = await Account.findOneAndUpdate(
                    {
                        _id: receiverAccount._id,
                        balance: { $gte: transfer.amount },
                    },
                    {
                        $inc: { balance: -transfer.amount },
                    },
                    { session, returnDocument: "after" }
                );

                if (!debitedReceiver) {
                    await session.abortTransaction();
                    session.endSession();
                    return res.status(400).json({
                        success: false,
                        message: "Receiver has insufficient balance for reversal",
                    });
                }

                // Credit sender
                const creditedSender = await Account.findByIdAndUpdate(
                    senderAccount._id,
                    {
                        $inc: { balance: transfer.amount },
                    },
                    { session, returnDocument: "after" }
                );

                transfer.status = TRANSACTION_STATUS.REVERSED;
                await transfer.save({ session });

                // Sender Credit Reversal Transaction
                await Transaction.create(
                    [
                        {
                            account: senderAccount._id,
                            user: senderAccount.user,
                            type: TRANSACTION_TYPES.REVERSAL,
                            amount: transfer.amount,
                            balanceBefore: senderBalanceBefore,
                            balanceAfter: roundMoney(creditedSender.balance),
                            status: TRANSACTION_STATUS.SUCCESS,
                            reference: `${reversalReference}-CR`,
                            description: `Reversal refund for transfer ${transfer.reference}`,
                        },
                    ],
                    { session }
                );

                // Receiver Debit Reversal Transaction
                await Transaction.create(
                    [
                        {
                            account: receiverAccount._id,
                            user: receiverAccount.user,
                            type: TRANSACTION_TYPES.REVERSAL,
                            amount: transfer.amount,
                            balanceBefore: receiverBalanceBefore,
                            balanceAfter: roundMoney(debitedReceiver.balance),
                            status: TRANSACTION_STATUS.SUCCESS,
                            reference: `${reversalReference}-DR`,
                            description: `Reversal deduction for transfer ${transfer.reference}`,
                        },
                    ],
                    { session }
                );

                await session.commitTransaction();
                session.endSession();

                return res.status(200).json({
                    success: true,
                    message: "Transfer reversed successfully",
                    transfer: {
                        id: transfer._id,
                        originalReference: transfer.reference,
                        reversalReference,
                        amount: roundMoney(transfer.amount),
                        status: transfer.status,
                    },
                });
            } catch (revError) {
                await session.abortTransaction();
                session.endSession();
                throw revError;
            }
        } else {
            // Standalone fallback
            const senderBalanceBefore = roundMoney(senderAccount.balance);
            const receiverBalanceBefore = roundMoney(receiverAccount.balance);

            const debitedReceiver = await Account.findOneAndUpdate(
                {
                    _id: receiverAccount._id,
                    balance: { $gte: transfer.amount },
                },
                {
                    $inc: { balance: -transfer.amount },
                },
                { returnDocument: "after" }
            );

            if (!debitedReceiver) {
                return res.status(400).json({
                    success: false,
                    message: "Receiver has insufficient balance for reversal",
                });
            }

            const creditedSender = await Account.findByIdAndUpdate(
                senderAccount._id,
                {
                    $inc: { balance: transfer.amount },
                },
                { returnDocument: "after" }
            );

            transfer.status = TRANSACTION_STATUS.REVERSED;
            await transfer.save();

            await Transaction.create({
                account: senderAccount._id,
                user: senderAccount.user,
                type: TRANSACTION_TYPES.REVERSAL,
                amount: transfer.amount,
                balanceBefore: senderBalanceBefore,
                balanceAfter: roundMoney(creditedSender.balance),
                status: TRANSACTION_STATUS.SUCCESS,
                reference: `${reversalReference}-CR`,
                description: `Reversal refund for transfer ${transfer.reference}`,
            });

            await Transaction.create({
                account: receiverAccount._id,
                user: receiverAccount.user,
                type: TRANSACTION_TYPES.REVERSAL,
                amount: transfer.amount,
                balanceBefore: receiverBalanceBefore,
                balanceAfter: roundMoney(debitedReceiver.balance),
                status: TRANSACTION_STATUS.SUCCESS,
                reference: `${reversalReference}-DR`,
                description: `Reversal deduction for transfer ${transfer.reference}`,
            });

            return res.status(200).json({
                success: true,
                message: "Transfer reversed successfully",
                transfer: {
                    id: transfer._id,
                    originalReference: transfer.reference,
                    reversalReference,
                    amount: roundMoney(transfer.amount),
                    status: transfer.status,
                },
            });
        }
    } catch (error) {
        console.error("Reverse transfer error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Transfer reversal failed",
        });
    }
};