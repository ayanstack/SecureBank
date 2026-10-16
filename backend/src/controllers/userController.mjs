import bcrypt from "bcryptjs";
import User from "../models/User.mjs";
import { LIMITS } from "../constants/index.mjs";

// =========================
// GET MY PROFILE
// =========================
export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select(
            "-password -transactionPin -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error("Profile error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// UPDATE PROFILE (SAFE ALLOWLIST)
// =========================
export const updateProfile = async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        const updateData = {};
        if (firstName && typeof firstName === "string") {
            updateData.firstName = firstName.trim();
        }
        if (lastName && typeof lastName === "string") {
            updateData.lastName = lastName.trim();
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid profile fields provided for update",
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            { $set: updateData },
            { returnDocument: "after", runValidators: true }
        ).select("-password -transactionPin -resetPasswordToken -emailVerificationToken");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        console.error("Update profile error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// SET TRANSACTION PIN
// =========================
export const setTransactionPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                message: "Transaction PIN must be exactly 4 digits",
            });
        }

        const user = await User.findById(req.user.userId).select("+transactionPin");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isTransactionPinSet) {
            return res.status(400).json({
                success: false,
                message: "Transaction PIN is already set. Use change PIN to update it.",
            });
        }

        const hashedPin = await bcrypt.hash(pin, 10);

        user.transactionPin = hashedPin;
        user.isTransactionPinSet = true;
        user.pinAttempts = 0;
        user.pinLockUntil = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Transaction PIN set successfully",
        });
    } catch (error) {
        console.error("Set transaction PIN error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// VERIFY TRANSACTION PIN (WITH ATTEMPT LOCKOUT)
// =========================
export const verifyTransactionPin = async (req, res) => {
    try {
        const { pin } = req.body;

        if (!pin || !/^\d{4}$/.test(pin)) {
            return res.status(400).json({
                success: false,
                message: "Transaction PIN must be exactly 4 digits",
            });
        }

        const user = await User.findById(req.user.userId).select(
            "+transactionPin +pinAttempts +pinLockUntil"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.isTransactionPinSet || !user.transactionPin) {
            return res.status(400).json({
                success: false,
                message: "Transaction PIN is not set",
            });
        }

        // Check if PIN is currently locked due to too many failed attempts
        if (user.isPinLocked()) {
            const minutesLeft = Math.ceil((user.pinLockUntil.getTime() - Date.now()) / (60 * 1000));
            return res.status(423).json({
                success: false,
                message: `Transaction PIN is temporarily locked due to too many failed attempts. Try again in ${minutesLeft} minute(s).`,
            });
        }

        const isPinCorrect = await bcrypt.compare(pin, user.transactionPin);

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

        // Reset failed PIN attempts on success
        if (user.pinAttempts > 0 || user.pinLockUntil) {
            user.pinAttempts = 0;
            user.pinLockUntil = null;
            await user.save();
        }

        return res.status(200).json({
            success: true,
            message: "Transaction PIN verified successfully",
        });
    } catch (error) {
        console.error("Verify transaction PIN error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// CHANGE TRANSACTION PIN
// =========================
export const changeTransactionPin = async (req, res) => {
    try {
        const { currentPin, newPin } = req.body;

        if (!currentPin || !newPin || !/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
            return res.status(400).json({
                success: false,
                message: "Current PIN and new PIN must each be exactly 4 digits",
            });
        }

        const user = await User.findById(req.user.userId).select(
            "+transactionPin +pinAttempts +pinLockUntil"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.isTransactionPinSet || !user.transactionPin) {
            return res.status(400).json({
                success: false,
                message: "Transaction PIN is not set yet. Please use set PIN first.",
            });
        }

        if (user.isPinLocked()) {
            return res.status(423).json({
                success: false,
                message: "Transaction PIN is temporarily locked due to failed attempts.",
            });
        }

        const isPinCorrect = await bcrypt.compare(currentPin, user.transactionPin);

        if (!isPinCorrect) {
            user.pinAttempts = (user.pinAttempts || 0) + 1;
            if (user.pinAttempts >= LIMITS.MAX_PIN_ATTEMPTS) {
                user.pinLockUntil = new Date(Date.now() + LIMITS.PIN_LOCKOUT_MS);
            }
            await user.save();

            return res.status(401).json({
                success: false,
                message: "Current transaction PIN is incorrect",
            });
        }

        if (currentPin === newPin) {
            return res.status(400).json({
                success: false,
                message: "New transaction PIN must be different from current PIN",
            });
        }

        const hashedPin = await bcrypt.hash(newPin, 10);
        user.transactionPin = hashedPin;
        user.pinAttempts = 0;
        user.pinLockUntil = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Transaction PIN changed successfully",
        });
    } catch (error) {
        console.error("Change transaction PIN error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};