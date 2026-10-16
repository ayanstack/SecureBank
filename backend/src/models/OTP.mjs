import mongoose from "mongoose";
import { OTP_PURPOSES } from "../constants/index.mjs";

const otpSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "OTP must belong to a user"],
            index: true,
        },

        otp: {
            type: String,
            required: [true, "OTP code is required"],
        },

        purpose: {
            type: String,
            enum: Object.values(OTP_PURPOSES),
            required: [true, "OTP purpose is required"],
        },

        expiresAt: {
            type: Date,
            required: [true, "Expiry timestamp is required"],
        },

        attempts: {
            type: Number,
            default: 0,
        },

        verified: {
            type: Boolean,
            default: false,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
otpSchema.index({ user: 1, purpose: 1, verified: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL auto-cleanup

const OTP = mongoose.model("OTP", otpSchema);

export default OTP;