import mongoose from "mongoose";
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from "../constants/index.mjs";

const transactionSchema = new mongoose.Schema(
    {
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: [true, "Transaction must belong to an account"],
            index: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Transaction must belong to a user"],
            index: true,
        },

        type: {
            type: String,
            enum: Object.values(TRANSACTION_TYPES),
            required: [true, "Transaction type is required"],
        },

        amount: {
            type: Number,
            required: [true, "Transaction amount is required"],
            min: [0.01, "Amount must be at least 0.01"],
        },

        balanceBefore: {
            type: Number,
            required: [true, "Balance before is required"],
            min: [0, "Balance before cannot be negative"],
        },

        balanceAfter: {
            type: Number,
            required: [true, "Balance after is required"],
            min: [0, "Balance after cannot be negative"],
        },

        status: {
            type: String,
            enum: Object.values(TRANSACTION_STATUS),
            default: TRANSACTION_STATUS.SUCCESS,
            index: true,
        },

        reference: {
            type: String,
            required: [true, "Transaction reference is required"],
            unique: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
transactionSchema.index({ account: 1, user: 1, createdAt: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ account: 1, type: 1, status: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;