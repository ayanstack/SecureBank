import crypto from "crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import noSqlSanitize from "./middleware/noSqlSanitize.mjs";
import noCache from "./middleware/securityHeaders.mjs";

import authRoutes from "./routes/authRoutes.mjs";
import userRoutes from "./routes/userRoutes.mjs";
import accountRoutes from "./routes/accountRoutes.mjs";
import transactionRoutes from "./routes/transactionRoutes.mjs";
import beneficiaryRoutes from "./routes/beneficiaryRoutes.mjs";
import transferRoutes from "./routes/transferRoutes.mjs";
import sessionRoutes from "./routes/sessionRoutes.mjs";
import otpRoutes from "./routes/otpRoutes.mjs";
import dashboardRoutes from "./routes/dashboardRoutes.mjs";
import notificationRoutes from "./routes/notificationRoutes.mjs";
import statementRoutes from "./routes/statementRoutes.mjs";
import adminRoutes from "./routes/adminRoutes.mjs";
import aiRoutes from "./routes/aiRoutes.mjs";
import supportRoutes from "./routes/supportRoutes.mjs";

const app = express();

app.disable("x-powered-by");

// Request ID middleware for tracing and debugging
app.use((req, res, next) => {
    req.id = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.id);
    next();
});

// HTTP request logging (non-sensitive, development only)
if (process.env.NODE_ENV !== "test") {
    app.use(
        morgan(":method :url :status :res[content-length] - :response-time ms", {
            skip: (req) => req.url === "/api/health",
        })
    );
}

// Security headers with Helmet
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:"],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

// CORS configuration supporting single or comma-separated origins, with support for Vercel & Render deployments
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174";
const allowedOrigins = clientOrigin.split(",").map((origin) => origin.trim().replace(/\/$/, ""));

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, curl, postman)
            if (!origin) {
                return callback(null, true);
            }

            const cleanOrigin = origin.replace(/\/$/, "");

            // Match exact allowed origins, wildcard, or vercel preview/production subdomains
            const isAllowed =
                allowedOrigins.includes("*") ||
                allowedOrigins.includes(cleanOrigin) ||
                cleanOrigin === "https://sb-fintech-demo.vercel.app" ||
                /^https:\/\/.*\.vercel\.app$/.test(cleanOrigin) ||
                /^https:\/\/.*\.onrender\.com$/.test(cleanOrigin) ||
                /^http:\/\/localhost:\d+$/.test(cleanOrigin);

            if (isAllowed) {
                return callback(null, true);
            }

            return callback(new Error(`CORS policy violation: origin '${origin}' not allowed`), false);
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key", "X-Idempotency-Key", "X-Request-Id"],
        credentials: true,
    })
);

// Prevent caching on authenticated sensitive routes
app.use("/api/accounts", noCache);
app.use("/api/transactions", noCache);
app.use("/api/transfers", noCache);
app.use("/api/statements", noCache);
app.use("/api/users", noCache);
app.use("/api/dashboard", noCache);
app.use("/api/sessions", noCache);
app.use("/api/notifications", noCache);
app.use("/api/admin", noCache);

// Request body parsing with safe limits
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

// Catch JSON body parsing errors before hitting routes
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Malformed JSON payload in request body",
        });
    }
    next(err);
});

// Request sanitization (NoSQL injection prevention for body, query, and params)
app.use(noSqlSanitize);

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 500,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
});

// Authentication rate limiter
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later.",
    },
});

// OTP rate limiter
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again later.",
    },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "CoinCraft API is running",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});

// Authentication routes with specific limiter
app.use("/api/auth", authLimiter, authRoutes);

// OTP routes with specific limiter
app.use("/api/otp", otpLimiter, otpRoutes);

// General API rate limiter on all remaining /api routes
app.use("/api", apiLimiter);

// Application routes
app.use("/api/users", userRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/statements", statementRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/support", supportRoutes);

// 404 handler
app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: `API endpoint '${req.originalUrl}' not found`,
    });
});

// Central error handler
app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    console.error(`[Error] ${req.method} ${req.url}:`, error.message);

    // Mongoose CastError (e.g. invalid ObjectId format)
    if (error.name === "CastError") {
        return res.status(400).json({
            success: false,
            message: `Invalid format for identifier '${error.path}'`,
        });
    }

    // Mongoose ValidationError
    if (error.name === "ValidationError") {
        const messages = Object.values(error.errors || {}).map((e) => e.message);
        return res.status(400).json({
            success: false,
            message: messages[0] || "Validation failed",
            errors: messages,
        });
    }

    // MongoDB duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0] || "field";
        return res.status(409).json({
            success: false,
            message: `A record with this ${field} already exists`,
        });
    }

    // JWT Errors
    if (error.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid authentication token",
        });
    }

    if (error.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Authentication token expired",
        });
    }

    const statusCode =
        Number.isInteger(error.status) && error.status >= 400 && error.status <= 599
            ? error.status
            : 500;

    return res.status(statusCode).json({
        success: false,
        message: statusCode < 500 ? error.message : "Internal server error",
    });
});

export default app;