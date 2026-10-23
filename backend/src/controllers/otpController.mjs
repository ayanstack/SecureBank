import crypto from "crypto";
import OTP from "../models/OTP.mjs";
import User from "../models/User.mjs";
import { OTP_PURPOSES, LIMITS } from "../constants/index.mjs";
import { sendEmail, isEmailConfigured } from "../utils/emailService.mjs";

const generateSecureOTP = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// =========================
// CREATE OTP
// =========================
export const createOTP = async (req, res) => {
    try {
        const { purpose } = req.body;

        if (!purpose || !Object.values(OTP_PURPOSES).includes(purpose)) {
            return res.status(400).json({
                success: false,
                message: `Valid OTP purpose required: ${Object.values(OTP_PURPOSES).join(", ")}`,
            });
        }

        // Enforce resend cooldown (60s)
        const recentOTP = await OTP.findOne({
            user: req.user.userId,
            purpose,
            createdAt: { $gt: new Date(Date.now() - LIMITS.OTP_RESEND_COOLDOWN_MS) },
        }).sort({ createdAt: -1 });

        if (recentOTP) {
            const secondsLeft = Math.ceil(
                (recentOTP.createdAt.getTime() + LIMITS.OTP_RESEND_COOLDOWN_MS - Date.now()) / 1000
            );
            return res.status(429).json({
                success: false,
                message: `Please wait ${secondsLeft} second(s) before requesting another OTP`,
            });
        }

        // Invalidate previous unverified OTPs for this purpose
        await OTP.updateMany(
            {
                user: req.user.userId,
                purpose,
                verified: false,
            },
            {
                $set: { verified: true },
            }
        );

        const otpCode = generateSecureOTP();
        const expiresAt = new Date(Date.now() + LIMITS.OTP_EXPIRY_MS);

        const otp = await OTP.create({
            user: req.user.userId,
            otp: otpCode,
            purpose,
            expiresAt,
            attempts: 0,
            verified: false,
        });

        // Send OTP via email if email exists
        const user = await User.findById(req.user.userId).select("email firstName");
        if (user && isEmailConfigured()) {
            sendEmail({
                to: user.email,
                subject: `Your CoinCraft OTP for ${purpose.replace(/_/g, " ")}`,
                text: `Hello ${user.firstName},\n\nYour One-Time Password (OTP) is: ${otpCode}\nThis code is valid for 5 minutes.\n\nNever share your OTP with anyone.`,
            }).catch((err) => console.error("OTP email delivery error:", err.message));
        }

        const isDevOrTest = process.env.NODE_ENV !== "production";

        return res.status(201).json({
            success: true,
            message: "OTP generated successfully",
            otpId: otp._id,
            expiresAt: otp.expiresAt,
            ...(isDevOrTest && { otp: otpCode }), // Only returned in dev/test environments
        });
    } catch (error) {
        console.error("Create OTP error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// VERIFY OTP
// =========================
export const verifyOTP = async (req, res) => {
    try {
        const { otpId, otp } = req.body;

        if (!otpId || !otp) {
            return res.status(400).json({
                success: false,
                message: "OTP ID and OTP are required",
            });
        }

        const otpRecord = await OTP.findOne({
            _id: otpId,
            user: req.user.userId,
            verified: false,
        });

        if (!otpRecord) {
            return res.status(404).json({
                success: false,
                message: "OTP not found or already verified",
            });
        }

        if (otpRecord.expiresAt < new Date()) {
            return res.status(400).json({
                success: false,
                message: "OTP has expired. Please request a new one.",
            });
        }

        if (otpRecord.attempts >= LIMITS.MAX_OTP_ATTEMPTS) {
            return res.status(429).json({
                success: false,
                message: "Maximum OTP verification attempts exceeded. Please request a new OTP.",
            });
        }

        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            const attemptsRemaining = Math.max(0, LIMITS.MAX_OTP_ATTEMPTS - otpRecord.attempts);
            return res.status(400).json({
                success: false,
                message: "Invalid OTP",
                attemptsRemaining,
            });
        }

        // Mark verified to prevent replay
        otpRecord.verified = true;
        await otpRecord.save();

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
        });
    } catch (error) {
        console.error("Verify OTP error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// RESEND OTP
// =========================
export const resendOTP = async (req, res) => {
    // Re-use createOTP logic which enforces cooldown, invalidates old, and issues new
    return createOTP(req, res);
};