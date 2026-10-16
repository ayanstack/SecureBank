import mongoose from "mongoose";

const fraudAlertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Fraud alert must relate to a user"],
            index: true,
        },
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null,
            index: true,
        },
        transaction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
            default: null,
        },
        alertType: {
            type: String,
            enum: [
                "HIGH_VALUE_TRANSFER",
                "RAPID_VELOCITY",
                "FAILED_LOGIN_SPIKE",
                "UNUSUAL_TIME_ACTIVITY",
                "NEW_DEVICE_OR_IP",
                "REPEATED_PIN_FAILURE"
            ],
            required: true,
        },
        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "MEDIUM",
            index: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: ["PENDING_REVIEW", "CLEARED", "CONFIRMED_FRAUD", "DISMISSED"],
            default: "PENDING_REVIEW",
            index: true,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        resolutionNotes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

fraudAlertSchema.index({ severity: 1, status: 1, createdAt: -1 });

const FraudAlert = mongoose.model("FraudAlert", fraudAlertSchema);
export default FraudAlert;
