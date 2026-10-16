import mongoose from "mongoose";
import { TRANSACTION_STATUS } from "../constants/index.mjs";

const transferSchema = new mongoose.Schema(
    {
        senderAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: [true, "Sender account is required"],
            index: true,
        },

        beneficiary: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Beneficiary",
            required: [true, "Beneficiary is required"],
            index: true,
        },

        receiverAccount: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            required: [true, "Receiver account is required"],
            index: true,
        },

        amount: {
            type: Number,
            required: [true, "Transfer amount is required"],
            min: [0.01, "Amount must be at least 0.01"],
        },

        status: {
            type: String,
            enum: Object.values(TRANSACTION_STATUS),
            default: TRANSACTION_STATUS.PENDING,
            index: true,
        },

        reference: {
            type: String,
            required: [true, "Transfer reference is required"],
            unique: true,
            trim: true,
        },

        idempotencyKey: {
            type: String,
            trim: true,
            default: null,
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
transferSchema.index({ senderAccount: 1, createdAt: -1 });
transferSchema.index({ receiverAccount: 1, createdAt: -1 });
transferSchema.index({ senderAccount: 1, idempotencyKey: 1 }, { sparse: true, unique: true });

const Transfer = mongoose.model("Transfer", transferSchema);

export default Transfer;
