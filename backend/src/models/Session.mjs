import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Session must belong to a user"],
            index: true,
        },

        refreshToken: {
            type: String,
            required: [true, "Refresh token is required"],
            index: true,
        },

        expiresAt: {
            type: Date,
            required: [true, "Expiry date is required"],
        },

        revoked: {
            type: Boolean,
            default: false,
            index: true,
        },

        ipAddress: {
            type: String,
            default: null,
        },

        userAgent: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
sessionSchema.index({ user: 1, revoked: 1 });
sessionSchema.index({ user: 1, expiresAt: 1 });
// TTL index: auto-delete expired sessions after 24 hours past expiry
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
