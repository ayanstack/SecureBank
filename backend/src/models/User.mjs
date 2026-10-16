import mongoose from "mongoose";
import { ROLES } from "../constants/index.mjs";

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, "First name is required"],
            trim: true,
            maxlength: [50, "First name cannot exceed 50 characters"],
        },

        lastName: {
            type: String,
            required: [true, "Last name is required"],
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"],
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email address"],
        },

        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters"],
            select: false,
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            unique: true,
            trim: true,
        },

        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.CUSTOMER,
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        failedLoginAttempts: {
            type: Number,
            default: 0,
            select: false,
        },

        lockUntil: {
            type: Date,
            default: null,
            select: false,
        },

        pinAttempts: {
            type: Number,
            default: 0,
            select: false,
        },

        pinLockUntil: {
            type: Date,
            default: null,
            select: false,
        },

        resetPasswordToken: {
            type: String,
            default: null,
            select: false,
        },

        resetPasswordExpires: {
            type: Date,
            default: null,
            select: false,
        },

        emailVerificationToken: {
            type: String,
            default: null,
            select: false,
        },

        emailVerificationExpires: {
            type: Date,
            default: null,
            select: false,
        },

        transactionPin: {
            type: String,
            default: null,
            select: false,
        },

        isTransactionPinSet: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });
userSchema.index({ emailVerificationToken: 1 }, { sparse: true });

userSchema.methods.isLocked = function () {
    return Boolean(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.isPinLocked = function () {
    return Boolean(this.pinLockUntil && this.pinLockUntil > Date.now());
};

const User = mongoose.model("User", userSchema);

export default User;