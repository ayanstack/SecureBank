import mongoose from "mongoose";
import { BENEFICIARY_STATUS } from "../constants/index.mjs";

const beneficiarySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Beneficiary must belong to a user"],
            index: true,
        },

        name: {
            type: String,
            required: [true, "Beneficiary name is required"],
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },

        accountNumber: {
            type: String,
            required: [true, "Account number is required"],
            trim: true,
        },

        ifscCode: {
            type: String,
            required: [true, "IFSC code is required"],
            trim: true,
            uppercase: true,
        },

        status: {
            type: String,
            enum: Object.values(BENEFICIARY_STATUS),
            default: BENEFICIARY_STATUS.ACTIVE,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound unique index: A user cannot add the exact same account number twice
beneficiarySchema.index({ user: 1, accountNumber: 1 }, { unique: true });

const Beneficiary = mongoose.model("Beneficiary", beneficiarySchema);

export default Beneficiary;