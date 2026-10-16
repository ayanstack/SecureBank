import FraudAlert from "../models/FraudAlert.mjs";
import Transaction from "../models/Transaction.mjs";
import AuditLog from "../models/AuditLog.mjs";

// Configurable threshold settings (defaults can be overridden via environment variables)
export const FRAUD_THRESHOLDS = {
    HIGH_VALUE_THRESHOLD: Number(process.env.FRAUD_HIGH_VALUE_THRESHOLD) || 50000,
    CRITICAL_VALUE_THRESHOLD: Number(process.env.FRAUD_CRITICAL_VALUE_THRESHOLD) || 200000,
    VELOCITY_MAX_TRANSACTIONS: Number(process.env.FRAUD_VELOCITY_MAX_TRANSACTIONS) || 3,
    VELOCITY_WINDOW_MINUTES: Number(process.env.FRAUD_VELOCITY_WINDOW_MINUTES) || 10,
    FAILED_SPIKE_MAX: Number(process.env.FRAUD_FAILED_SPIKE_MAX) || 3,
    FAILED_SPIKE_WINDOW_MINUTES: Number(process.env.FRAUD_FAILED_SPIKE_WINDOW_MINUTES) || 15,
};

/**
 * Deterministic rule-based fraud & suspicious activity evaluation engine.
 * Never relies on unverified black-box AI decisions to reject funds.
 */
export const evaluateTransactionRisk = async ({ userId, accountId, amount, type, status = "SUCCESS" }) => {
    const alerts = [];
    const numAmount = Number(amount) || 0;

    // Rule 1: High-value single transaction threshold (default ₹50,000+)
    if (numAmount >= FRAUD_THRESHOLDS.HIGH_VALUE_THRESHOLD) {
        const isCritical = numAmount >= FRAUD_THRESHOLDS.CRITICAL_VALUE_THRESHOLD;
        alerts.push({
            alertType: "HIGH_VALUE_TRANSFER",
            severity: isCritical ? "CRITICAL" : "HIGH",
            description: `Single ${type} of ₹${numAmount.toLocaleString("en-IN")} exceeds the high-value risk threshold (₹${FRAUD_THRESHOLDS.HIGH_VALUE_THRESHOLD.toLocaleString("en-IN")}).`,
            metadata: {
                amount: numAmount,
                threshold: FRAUD_THRESHOLDS.HIGH_VALUE_THRESHOLD,
                criticalThreshold: FRAUD_THRESHOLDS.CRITICAL_VALUE_THRESHOLD,
                type,
            },
        });
    }

    // Rule 2: Velocity check (default: 3+ transactions within 10 minutes)
    const velocityWindow = new Date(Date.now() - FRAUD_THRESHOLDS.VELOCITY_WINDOW_MINUTES * 60 * 1000);
    const recentCount = await Transaction.countDocuments({
        user: userId,
        createdAt: { $gte: velocityWindow },
    });

    if (recentCount >= FRAUD_THRESHOLDS.VELOCITY_MAX_TRANSACTIONS) {
        alerts.push({
            alertType: "RAPID_VELOCITY",
            severity: recentCount >= FRAUD_THRESHOLDS.VELOCITY_MAX_TRANSACTIONS + 2 ? "HIGH" : "MEDIUM",
            description: `Velocity spike: ${recentCount + 1} transactions recorded within ${FRAUD_THRESHOLDS.VELOCITY_WINDOW_MINUTES} minutes.`,
            metadata: {
                count: recentCount + 1,
                windowMinutes: FRAUD_THRESHOLDS.VELOCITY_WINDOW_MINUTES,
                threshold: FRAUD_THRESHOLDS.VELOCITY_MAX_TRANSACTIONS,
            },
        });
    }

    // Rule 3: Repeated failed transactions spike (3+ failed transactions within 15 minutes)
    const failedWindow = new Date(Date.now() - FRAUD_THRESHOLDS.FAILED_SPIKE_WINDOW_MINUTES * 60 * 1000);
    const failedCount = await Transaction.countDocuments({
        user: userId,
        status: "FAILED",
        createdAt: { $gte: failedWindow },
    });

    if (failedCount >= FRAUD_THRESHOLDS.FAILED_SPIKE_MAX) {
        alerts.push({
            alertType: "REPEATED_PIN_FAILURE",
            severity: "HIGH",
            description: `Failed operations anomaly: ${failedCount} failed attempts detected within ${FRAUD_THRESHOLDS.FAILED_SPIKE_WINDOW_MINUTES} minutes.`,
            metadata: {
                failedCount,
                windowMinutes: FRAUD_THRESHOLDS.FAILED_SPIKE_WINDOW_MINUTES,
                threshold: FRAUD_THRESHOLDS.FAILED_SPIKE_MAX,
            },
        });
    }

    // Persist any generated alerts
    for (const alertData of alerts) {
        await FraudAlert.create({
            user: userId,
            account: accountId,
            ...alertData,
        }).catch((err) => console.error("[FraudAlert] Save error:", err.message));
    }

    return {
        flagged: alerts.length > 0,
        alerts,
    };
};

/**
 * Records auditable actions for administrative and security governance.
 */
export const logAuditEvent = async ({ user, action, resource, resourceId, ipAddress, userAgent, status = "SUCCESS", details = {} }) => {
    try {
        await AuditLog.create({
            user,
            action,
            resource,
            resourceId,
            ipAddress,
            userAgent,
            status,
            details,
        });
    } catch (err) {
        console.error("[AuditLog] Failed to record audit log:", err.message);
    }
};
