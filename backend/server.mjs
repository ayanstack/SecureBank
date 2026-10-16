import "dotenv/config";
import http from "http";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { execSync } from "child_process";

import app from "./src/app.mjs";
import connectDB, { disconnectDB } from "./src/config/db.mjs";
import { setIO } from "./src/config/socket.mjs";

const PORT = process.env.PORT || 5000;

// Environment variable validation at startup
const requiredEnvVars = ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MONGO_URI"];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1);
}

const server = http.createServer(app);

const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174";
const allowedOrigins = clientOrigin.split(",").map((origin) => origin.trim().replace(/\/$/, ""));

const io = new Server(server, {
    cors: {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const cleanOrigin = origin.replace(/\/$/, "");
            const isAllowed =
                allowedOrigins.includes("*") ||
                allowedOrigins.includes(cleanOrigin) ||
                cleanOrigin === "https://sb-fintech-demo.vercel.app" ||
                /^https:\/\/.*\.vercel\.app$/.test(cleanOrigin) ||
                /^https:\/\/.*\.onrender\.com$/.test(cleanOrigin) ||
                /^http:\/\/localhost:\d+$/.test(cleanOrigin);

            if (isAllowed) return callback(null, true);
            return callback(new Error("Socket CORS origin not allowed"), false);
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Authenticate Socket.IO connections using access token
io.use((socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Authentication required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        if (!decoded.userId || !decoded.sessionId) {
            return next(new Error("Invalid authentication token"));
        }

        socket.data.user = {
            userId: decoded.userId.toString(),
            role: decoded.role,
            sessionId: decoded.sessionId.toString(),
        };

        next();
    } catch {
        next(new Error("Invalid or expired token"));
    }
});

setIO(io);

io.on("connection", (socket) => {
    const authenticatedUserId = socket.data.user.userId;

    // Automatically join ONLY the authenticated user's room
    socket.join(authenticatedUserId);

    console.log(`[Socket] Authenticated socket connected for user: ${authenticatedUserId}`);

    socket.on("join-user-room", (requestedUserId, acknowledge) => {
        const reply = typeof acknowledge === "function" ? acknowledge : () => {};

        if (!requestedUserId || requestedUserId.toString() !== authenticatedUserId) {
            reply({
                success: false,
                message: "Unauthorized: You cannot join another user's room",
            });
            return;
        }

        reply({
            success: true,
            message: "Joined your own user room",
        });
    });

    socket.on("disconnect", (reason) => {
        console.log(`[Socket] Disconnected user ${authenticatedUserId}: ${reason}`);
    });
});

let isShuttingDown = false;

const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
        console.log("HTTP server closed");

        try {
            // Close Socket.IO
            io.close();
            console.log("Socket.IO server closed");

            // Disconnect MongoDB
            await disconnectDB();

            console.log("Graceful shutdown completed successfully");
            process.exit(0);
        } catch (err) {
            console.error("Error during graceful shutdown:", err.message);
            process.exit(1);
        }
    });

    // Force shutdown after timeout if graceful close hangs
    setTimeout(() => {
        console.error("Graceful shutdown timed out. Forcing process exit.");
        process.exit(1);
    }, 10000).unref();
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

const freePortIfOccupied = (port) => {
    if (process.env.NODE_ENV === "production") return;
    try {
        if (process.platform === "win32") {
            const output = execSync("netstat -ano", { encoding: "utf-8" });
            const lines = output.split("\n");
            for (const line of lines) {
                if (line.includes(`:${port}`) && line.includes("LISTENING")) {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[parts.length - 1];
                    if (pid && pid !== String(process.pid) && /^\d+$/.test(pid)) {
                        try {
                            execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
                            console.log(`Port ${port} was occupied by stale process (PID ${pid}). Freed automatically.`);
                        } catch {
                            // Process might have already exited
                        }
                    }
                }
            }
        }
    } catch {
        // Port free or command not applicable
    }
};

const startServer = async () => {
    try {
        freePortIfOccupied(PORT);

        await connectDB();

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`FATAL: Port ${PORT} is already in use by another process. Set PORT in .env or stop the existing process.`);
            } else {
                console.error("Server network error:", error.message);
            }
            process.exit(1);
        });

        server.listen(PORT, () => {
            console.log(`SecureBank server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup error:", error.message);
        process.exit(1);
    }
};

startServer();

export { server, io };
