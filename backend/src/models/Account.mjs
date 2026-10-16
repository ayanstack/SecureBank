import mongoose from "mongoose";
import { ACCOUNT_TYPES, ACCOUNT_STATUS } from "../constants/index.mjs";

const accountSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Account must belong to a user"],
            index: true,
        },
        accountNumber: {
            type: String,
            required: [true, "Account number is required"],
            unique: true,
            trim: true,
        },
        accountType: {
            type: String,
            enum: Object.values(ACCOUNT_TYPES),
            default: ACCOUNT_TYPES.SAVINGS,
        },
        ifscCode: {
            type: String,
            required: [true, "IFSC code is required"],
            trim: true,
        },
        balance: {
            type: Number,
            default: 0,
            min: [0, "Account balance cannot be negative"],
        },
        status: {
            type: String,
            enum: Object.values(ACCOUNT_STATUS),
            default: ACCOUNT_STATUS.ACTIVE,
            index: true,
        },
        isPrimary: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
accountSchema.index({ user: 1, status: 1 });
accountSchema.index({ user: 1, isPrimary: 1 });

const Account = mongoose.model("Account", accountSchema);

export default Account;