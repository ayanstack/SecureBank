import mongoose from "mongoose";
import User from "../models/User.mjs";
import Account from "../models/Account.mjs";
import Session from "../models/Session.mjs";
import { ROLES, ACCOUNT_STATUS } from "../constants/index.mjs";
import { roundMoney, addMoney } from "../utils/money.mjs";

// =========================
// LIST ALL USERS (ADMIN)
// =========================
export const listUsers = async (req, res) => {
    try {
        const {
            role,
            isActive,
            isEmailVerified,
            search,
            page = 1,
            limit = 20,
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const filter = {};

        if (role && Object.values(ROLES).includes(role.toUpperCase())) {
            filter.role = role.toUpperCase();
        }

        if (isActive !== undefined) {
            filter.isActive = isActive === "true" || isActive === true;
        }

        if (isEmailVerified !== undefined) {
            filter.isEmailVerified = isEmailVerified === "true" || isEmailVerified === true;
        }

        if (search) {
            const escapedSearch = String(search).replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );
            filter.$or = [
                { firstName: { $regex: escapedSearch, $options: "i" } },
                { lastName: { $regex: escapedSearch, $options: "i" } },
                { email: { $regex: escapedSearch, $options: "i" } },
                { phone: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

        const allowedSortFields = ["createdAt", "email", "firstName", "lastName", "role"];
        const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
        const safeSortOrder = sortOrder === "asc" ? 1 : -1;

        const totalUsers = await User.countDocuments(filter);

        const users = await User.find(filter)
            .select("firstName lastName email phone role isActive isEmailVerified isTransactionPinSet createdAt updatedAt")
            .sort({ [safeSortBy]: safeSortOrder })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .lean();

        const totalPages = Math.ceil(totalUsers / limitNumber);

        return res.status(200).json({
            success: true,
            count: users.length,
            pagination: {
                currentPage: pageNumber,
                limit: limitNumber,
                totalUsers,
                totalPages,
                hasNextPage: pageNumber < totalPages,
                hasPreviousPage: pageNumber > 1,
            },
            users: users.map((u) => ({
                id: u._id,
                firstName: u.firstName,
                lastName: u.lastName,
                email: u.email,
                phone: u.phone,
                role: u.role,
                isActive: u.isActive,
                isEmailVerified: u.isEmailVerified,
                isTransactionPinSet: u.isTransactionPinSet,
                createdAt: u.createdAt,
            })),
        });
    } catch (error) {
        console.error("Admin list users error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// GET USER DETAILS (ADMIN)
// =========================
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        const user = await User.findById(id).select(
            "firstName lastName email phone role isActive isEmailVerified isTransactionPinSet createdAt updatedAt"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Get user's accounts summary
        const accounts = await Account.find({
            user: id,
            status: { $ne: ACCOUNT_STATUS.CLOSED },
        }).select("accountNumber accountType balance status isPrimary createdAt");

        const totalBalance = accounts.reduce(
            (total, account) => addMoney(total, account.balance),
            0
        );

        // Get active session count
        const activeSessionCount = await Session.countDocuments({
            user: id,
            revoked: false,
            expiresAt: { $gt: new Date() },
        });

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isActive: user.isActive,
                isEmailVerified: user.isEmailVerified,
                isTransactionPinSet: user.isTransactionPinSet,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
            accounts: accounts.map((acc) => ({
                id: acc._id,
                accountNumber: acc.accountNumber,
                accountType: acc.accountType,
                balance: roundMoney(acc.balance),
                status: acc.status,
                isPrimary: acc.isPrimary,
                createdAt: acc.createdAt,
            })),
            summary: {
                totalAccounts: accounts.length,
                totalBalance: roundMoney(totalBalance),
                activeSessionCount,
            },
        });
    } catch (error) {
        console.error("Admin get user error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// DEACTIVATE USER (ADMIN)
// =========================
export const deactivateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        // Prevent self-deactivation
        if (id === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot deactivate your own account",
            });
        }

        const user = await User.findById(id).select("_id role isActive");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (!user.isActive) {
            return res.status(400).json({
                success: false,
                message: "User is already deactivated",
            });
        }

        // Prevent deactivating higher-privilege users
        const roleHierarchy = [ROLES.CUSTOMER, ROLES.SUPPORT, ROLES.MANAGER, ROLES.ADMIN, ROLES.SUPER_ADMIN];
        const targetLevel = roleHierarchy.indexOf(user.role);
        const requestorLevel = roleHierarchy.indexOf(req.user.role);

        if (targetLevel >= requestorLevel) {
            return res.status(403).json({
                success: false,
                message: "You cannot deactivate a user with equal or higher privileges",
            });
        }

        user.isActive = false;
        await user.save();

        // Revoke all active sessions for the deactivated user
        await Session.updateMany(
            { user: id, revoked: false },
            { $set: { revoked: true } }
        );

        return res.status(200).json({
            success: true,
            message: "User deactivated successfully",
            userId: user._id,
        });
    } catch (error) {
        console.error("Admin deactivate user error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// REACTIVATE USER (ADMIN)
// =========================
export const reactivateUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID",
            });
        }

        const user = await User.findById(id).select("_id isActive");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.isActive) {
            return res.status(400).json({
                success: false,
                message: "User is already active",
            });
        }

        user.isActive = true;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "User reactivated successfully",
            userId: user._id,
        });
    } catch (error) {
        console.error("Admin reactivate user error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// PURGE EXPIRED SESSIONS (ADMIN)
// =========================
export const purgeExpiredSessions = async (req, res) => {
    try {
        const result = await Session.deleteMany({
            $or: [
                { revoked: true },
                { expiresAt: { $lt: new Date() } },
            ],
        });

        return res.status(200).json({
            success: true,
            message: "Expired and revoked sessions purged successfully",
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error("Admin purge sessions error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// LIST FRAUD ALERTS (ADMIN)
// =========================
export const listFraudAlerts = async (req, res) => {
    try {
        const FraudAlert = (await import("../models/FraudAlert.mjs")).default;
        const alerts = await FraudAlert.find()
            .populate("user", "firstName lastName email phone")
            .populate("account", "accountNumber accountType")
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json({
            success: true,
            count: alerts.length,
            alerts,
        });
    } catch (error) {
        console.error("Admin list fraud alerts error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to list fraud alerts." });
    }
};

// =========================
// REVIEW FRAUD ALERT (ADMIN)
// =========================
export const reviewFraudAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, resolutionNotes } = req.body;
        const FraudAlert = (await import("../models/FraudAlert.mjs")).default;

        const alert = await FraudAlert.findById(id);
        if (!alert) {
            return res.status(404).json({ success: false, message: "Fraud alert not found." });
        }

        alert.status = status || "CLEARED";
        alert.resolutionNotes = resolutionNotes || "";
        alert.reviewedBy = req.user._id;
        await alert.save();

        return res.status(200).json({
            success: true,
            message: "Fraud alert updated successfully.",
            alert,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// =========================
// LIST AUDIT LOGS (ADMIN)
// =========================
export const listAuditLogs = async (req, res) => {
    try {
        const AuditLog = (await import("../models/AuditLog.mjs")).default;
        const logs = await AuditLog.find()
            .populate("user", "firstName lastName email role")
            .sort({ createdAt: -1 })
            .limit(100);

        return res.status(200).json({
            success: true,
            count: logs.length,
            logs,
        });
    } catch (error) {
        console.error("Admin list audit logs error:", error.message);
        return res.status(500).json({ success: false, message: "Failed to list audit logs." });
    }
};

