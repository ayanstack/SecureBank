import jwt from "jsonwebtoken";
import Session from "../models/Session.mjs";
import User from "../models/User.mjs";

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const token = authHeader.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(
                token,
                process.env.JWT_ACCESS_SECRET
            );
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: jwtError.name === "TokenExpiredError" ? "Token expired" : "Invalid or expired token",
            });
        }

        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token payload",
            });
        }

        // Verify active session if sessionId is provided in token
        if (decoded.sessionId) {
            const session = await Session.findOne({
                _id: decoded.sessionId,
                revoked: false,
                expiresAt: { $gt: new Date() },
            });

            if (!session) {
                return res.status(401).json({
                    success: false,
                    message: "Session has been revoked or expired. Please log in again.",
                });
            }
        }

        // Verify user existence and active status
        const user = await User.findById(decoded.userId).select("_id role isActive email firstName lastName isEmailVerified");

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account no longer exists",
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Your account has been deactivated. Please contact support.",
            });
        }

        req.user = {
            _id: user._id,
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            sessionId: decoded.sessionId ? decoded.sessionId.toString() : null,
        };

        next();
    } catch (error) {
        console.error("Auth middleware error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Authentication failed",
        });
    }
};

export { protect };
export default protect;