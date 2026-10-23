import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.mjs";
import Session from "../models/Session.mjs";
import { ROLES, LIMITS } from "../constants/index.mjs";
import { sendEmail, isEmailConfigured } from "../utils/emailService.mjs";

// Helper to generate secure random token
const generateSecureToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

// =========================
// REGISTER USER
// =========================
export const registerUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        if (!firstName || !lastName || !email || !password || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const normalizedPhone = phone.trim();

        // Check for existing user
        const existingUser = await User.findOne({
            $or: [{ email: normalizedEmail }, { phone: normalizedPhone }],
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Email or phone already registered",
            });
        }

        // Hash password with cost factor 12
        const hashedPassword = await bcrypt.hash(password, 12);

        // Explicitly assign CUSTOMER role on server, ignoring any client-supplied role
        const verificationToken = jwt.sign(
            { email: normalizedEmail, purpose: "email_verification" },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "15m" }
        );

        const user = await User.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: normalizedPhone,
            role: ROLES.CUSTOMER,
            isEmailVerified: false,
            isActive: true,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
        });

        // Optionally send verification email
        if (isEmailConfigured()) {
            sendEmail({
                to: normalizedEmail,
                subject: "Verify your CoinCraft account",
                text: `Welcome to CoinCraft! Your email verification token is: ${verificationToken}`,
            }).catch((err) => console.error("Email send error:", err.message));
        }

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            verificationToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Email or phone already registered",
            });
        }

        console.error("Register error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// VERIFY EMAIL
// =========================
export const verifyEmail = async (req, res) => {
    try {
        const { verificationToken } = req.body;

        if (!verificationToken) {
            return res.status(400).json({
                success: false,
                message: "Verification token is required",
            });
        }

        const user = await User.findOne({
            emailVerificationToken: verificationToken,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification token",
            });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
        });
    } catch (error) {
        console.error("Email verification error:", error.message);
        return res.status(400).json({
            success: false,
            message: "Invalid or expired verification token",
        });
    }
};

// =========================
// LOGIN USER
// =========================
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Select password and security lockout fields
        const user = await User.findOne({ email: normalizedEmail }).select(
            "+password +failedLoginAttempts +lockUntil"
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check if account is temporarily locked due to failed attempts
        if (user.isLocked()) {
            const minutesLeft = Math.ceil((user.lockUntil.getTime() - Date.now()) / (60 * 1000));
            return res.status(423).json({
                success: false,
                message: `Account is temporarily locked due to too many failed login attempts. Try again in ${minutesLeft} minute(s).`,
            });
        }

        // Verify password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= LIMITS.MAX_FAILED_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LIMITS.LOGIN_LOCKOUT_MS);
            }
            await user.save();

            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check account eligibility
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account is deactivated. Please contact support.",
            });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before login",
            });
        }

        // Reset failed login attempts on successful login
        if (user.failedLoginAttempts > 0 || user.lockUntil) {
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
            await user.save();
        }

        // Generate Refresh Token (90 days)
        const refreshToken = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                tokenVersion: Date.now(),
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "90d" }
        );

        const refreshTokenExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

        // Create Session
        const session = await Session.create({
            user: user._id,
            refreshToken,
            expiresAt: refreshTokenExpiresAt,
            ipAddress: req.ip || req.connection?.remoteAddress,
            userAgent: req.headers["user-agent"] || null,
        });

        // Generate Access Token with sessionId (30 days)
        const accessToken = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                sessionId: session._id.toString(),
            },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "30d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// RESEND EMAIL VERIFICATION
// =========================
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // Prevent email enumeration
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If the email is registered and unverified, a verification link has been sent.",
            });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: "Email is already verified",
            });
        }

        const verificationToken = jwt.sign(
            { email: normalizedEmail, purpose: "email_verification" },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "15m" }
        );

        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        if (isEmailConfigured()) {
            sendEmail({
                to: normalizedEmail,
                subject: "CoinCraft Email Verification",
                text: `Your email verification token is: ${verificationToken}`,
            }).catch((err) => console.error("Email send error:", err.message));
        }

        return res.status(200).json({
            success: true,
            message: "Verification token generated successfully",
            verificationToken,
        });
    } catch (error) {
        console.error("Resend verification error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// REFRESH ACCESS TOKEN (WITH TOKEN ROTATION)
// =========================
export const refreshAccessToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        // Find session
        const session = await Session.findOne({ refreshToken });

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Invalid or revoked refresh token",
            });
        }

        // Reuse detection: If token was already revoked, someone may have stolen it
        if (session.revoked) {
            // Revoke all other sessions for this user for safety
            await Session.updateMany({ user: session.user }, { $set: { revoked: true } });
            console.warn(`[Security Alert] Refresh token reuse detected for user ${session.user}. All sessions revoked.`);

            return res.status(401).json({
                success: false,
                message: "Suspicious session activity detected. Please log in again.",
            });
        }

        // Check expiration
        if (session.expiresAt < new Date()) {
            session.revoked = true;
            await session.save();

            return res.status(401).json({
                success: false,
                message: "Refresh token expired",
            });
        }

        // Verify refresh token signature
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            session.revoked = true;
            await session.save();

            return res.status(401).json({
                success: false,
                message: "Invalid refresh token",
            });
        }

        // Find active user
        const user = await User.findById(decoded.userId).select("_id role isActive");

        if (!user || user.isActive === false) {
            session.revoked = true;
            await session.save();

            return res.status(401).json({
                success: false,
                message: "User account is unavailable",
            });
        }

        // ROTATION: Issue new refresh token (90 days) and update session
        const newRefreshToken = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                tokenVersion: Date.now(),
            },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "90d" }
        );

        session.refreshToken = newRefreshToken;
        session.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        await session.save();

        // Issue new access token (30 days)
        const newAccessToken = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                sessionId: session._id.toString(),
            },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: "30d" }
        );

        return res.status(200).json({
            success: true,
            message: "Access token refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (error) {
        console.error("Refresh token error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired refresh token",
        });
    }
};

// =========================
// LOGOUT USER
// =========================
export const logoutUser = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token is required",
            });
        }

        const session = await Session.findOne({
            refreshToken,
            revoked: false,
        });

        if (!session) {
            return res.status(200).json({
                success: true,
                message: "Logout successful",
            });
        }

        session.revoked = true;
        await session.save();

        return res.status(200).json({
            success: true,
            message: "Logout successful",
        });
    } catch (error) {
        console.error("Logout error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// CHANGE PASSWORD
// =========================
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current password and new password are required",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters",
            });
        }

        const user = await User.findById(req.user.userId).select("+password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: "New password must be different from current password",
            });
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        // Security requirement: Invalidate ALL active sessions for this user on password change
        await Session.updateMany(
            { user: user._id, revoked: false },
            { $set: { revoked: true } }
        );

        return res.status(200).json({
            success: true,
            message: "Password changed successfully. Please log in again with your new password.",
        });
    } catch (error) {
        console.error("Change password error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// FORGOT PASSWORD
// =========================
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required",
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });

        // Anti-enumeration: Return same success message whether user exists or not
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If your email is registered, a password reset token has been sent.",
            });
        }

        const resetToken = jwt.sign(
            { userId: user._id, purpose: "password_reset" },
            process.env.JWT_REFRESH_SECRET,
            { expiresIn: "15m" }
        );

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',')[0].trim() : "http://localhost:5173";
        const resetLink = `${clientUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

        if (isEmailConfigured()) {
            sendEmail({
                to: normalizedEmail,
                subject: "CoinCraft Password Reset Request",
                text: `You requested a password reset for your CoinCraft account.\n\nClick the link below to set a new password:\n${resetLink}\n\nThis link expires in 15 minutes.\nIf you did not request this, please ignore this email.`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #0f172a; margin-bottom: 16px;">Reset Your CoinCraft Password</h2>
                        <p style="color: #475569; font-size: 15px; line-height: 1.5;">We received a request to reset your password. Click the button below to proceed:</p>
                        <div style="margin: 28px 0;">
                            <a href="${resetLink}" style="background-color: #0284c7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #64748b; font-size: 13px;">Or copy and paste this link in your browser:<br/><a href="${resetLink}" style="color: #0284c7;">${resetLink}</a></p>
                        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">This link is valid for 15 minutes. If you did not make this request, your account is still secure.</p>
                    </div>
                `
            }).catch((err) => console.error("Email send error:", err.message));
        }

        return res.status(200).json({
            success: true,
            message: "If your email is registered, a password reset link has been sent.",
            resetToken,
            resetLink,
        });
    } catch (error) {
        console.error("Forgot password error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// RESET PASSWORD
// =========================
export const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Reset token and new password are required",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters",
            });
        }

        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired reset token",
            });
        }

        // Hash new password
        user.password = await bcrypt.hash(newPassword, 12);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        // Invalidate all active sessions for this user on password reset
        await Session.updateMany(
            { user: user._id, revoked: false },
            { $set: { revoked: true } }
        );

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. Please log in with your new password.",
        });
    } catch (error) {
        console.error("Reset password error:", error.message);
        return res.status(400).json({
            success: false,
            message: "Invalid or expired reset token",
        });
    }
};