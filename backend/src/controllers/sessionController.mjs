import mongoose from "mongoose";
import Session from "../models/Session.mjs";

// =========================
// GET MY SESSIONS
// =========================
export const getMySessions = async (req, res) => {
    try {
        const sessions = await Session.find({
            user: req.user.userId,
            revoked: false,
            expiresAt: { $gt: new Date() },
        })
            .select("_id createdAt expiresAt ipAddress userAgent")
            .sort({ createdAt: -1 })
            .lean();

        const currentSessionId = req.user.sessionId;

        return res.status(200).json({
            success: true,
            count: sessions.length,
            sessions: sessions.map((s) => ({
                id: s._id,
                isCurrent: currentSessionId ? s._id.toString() === currentSessionId : false,
                ipAddress: s.ipAddress || "Unknown",
                userAgent: s.userAgent || "Unknown device",
                createdAt: s.createdAt,
                expiresAt: s.expiresAt,
            })),
        });
    } catch (error) {
        console.error("Get sessions error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// REVOKE SESSION
// =========================
export const revokeSession = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid session ID",
            });
        }

        const session = await Session.findOne({
            _id: id,
            user: req.user.userId,
            revoked: false,
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: "Active session not found",
            });
        }

        session.revoked = true;
        await session.save();

        return res.status(200).json({
            success: true,
            message: "Session revoked successfully",
            sessionId: session._id,
        });
    } catch (error) {
        console.error("Revoke session error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// REVOKE ALL OTHER SESSIONS
// =========================
export const revokeAllOtherSessions = async (req, res) => {
    try {
        const currentSessionId = req.user.sessionId;

        if (!currentSessionId) {
            return res.status(400).json({
                success: false,
                message: "Current session ID not found in authentication context",
            });
        }

        const result = await Session.updateMany(
            {
                user: req.user.userId,
                _id: { $ne: currentSessionId },
                revoked: false,
            },
            {
                $set: { revoked: true },
            }
        );

        return res.status(200).json({
            success: true,
            message: "All other sessions revoked successfully",
            revokedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error("Revoke all other sessions error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};