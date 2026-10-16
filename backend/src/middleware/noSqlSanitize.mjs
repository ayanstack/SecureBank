const blockedKeys = new Set(["__proto__", "prototype", "constructor"]);

function hasProhibitedKey(obj) {
    if (!obj || typeof obj !== "object") return false;
    for (const key of Object.keys(obj)) {
        if (key.includes("$") || key.includes(".") || blockedKeys.has(key)) {
            return true;
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
            if (hasProhibitedKey(obj[key])) return true;
        }
    }
    return false;
}

function sanitizeValue(value) {
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (value !== null && typeof value === "object") {
        const cleaned = {};

        for (const [key, item] of Object.entries(value)) {
            if (key.includes("$") || key.includes(".") || blockedKeys.has(key)) {
                continue;
            }

            cleaned[key] = sanitizeValue(item);
        }

        return cleaned;
    }

    return value;
}

export default function noSqlSanitize(req, res, next) {
    try {
        // Deeply sanitize body
        if (req.body && typeof req.body === "object") {
            req.body = sanitizeValue(req.body);
        }

        // Check query and params for NoSQL injection attempts without breaking Express 5 property descriptors
        if (req.query && hasProhibitedKey(req.query)) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameter containing prohibited operators",
            });
        }

        if (req.params && hasProhibitedKey(req.params)) {
            return res.status(400).json({
                success: false,
                message: "Invalid route parameter containing prohibited characters",
            });
        }

        next();
    } catch (error) {
        next(error);
    }
}
