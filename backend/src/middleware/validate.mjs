import mongoose from "mongoose";

export const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const validateRequest = (schema) => {
    return (req, res, next) => {
        const errors = [];

        // Validate params
        if (schema.params) {
            for (const [field, rule] of Object.entries(schema.params)) {
                const value = req.params[field];
                const error = validateField(field, value, rule, "Route parameter");
                if (error) errors.push(error);
            }
        }

        // Validate query
        if (schema.query) {
            for (const [field, rule] of Object.entries(schema.query)) {
                const value = req.query[field];
                const error = validateField(field, value, rule, "Query parameter");
                if (error) errors.push(error);
            }
        }

        // Validate body
        if (schema.body) {
            if (schema.disallowUnknownBody) {
                const allowedKeys = new Set(Object.keys(schema.body));
                for (const key of Object.keys(req.body || {})) {
                    if (!allowedKeys.has(key)) {
                        errors.push(`Unknown field '${key}' is not allowed in request body`);
                    }
                }
            }

            for (const [field, rule] of Object.entries(schema.body)) {
                const value = req.body?.[field];
                const error = validateField(field, value, rule, "Field");
                if (error) errors.push(error);
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors[0],
                errors,
            });
        }

        next();
    };
};

function validateField(field, value, rule, locationLabel) {
    const isPresent = value !== undefined && value !== null && value !== "";

    if (rule.required && !isPresent) {
        return `${locationLabel} '${field}' is required`;
    }

    if (!isPresent) {
        return null; // optional and not present
    }

    // Type checks
    if (rule.type === "objectId") {
        if (!isValidObjectId(value)) {
            return `${locationLabel} '${field}' must be a valid 24-character hex ID`;
        }
    } else if (rule.type === "number") {
        const num = Number(value);
        if (isNaN(num) || !Number.isFinite(num)) {
            return `${locationLabel} '${field}' must be a valid number`;
        }
        if (rule.min !== undefined && num < rule.min) {
            return `${locationLabel} '${field}' must be at least ${rule.min}`;
        }
        if (rule.max !== undefined && num > rule.max) {
            return `${locationLabel} '${field}' must be at most ${rule.max}`;
        }
    } else if (rule.type === "string") {
        if (typeof value !== "string") {
            return `${locationLabel} '${field}' must be a string`;
        }
        if (rule.minLength && value.length < rule.minLength) {
            return `${locationLabel} '${field}' must be at least ${rule.minLength} characters`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
            return `${locationLabel} '${field}' cannot exceed ${rule.maxLength} characters`;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
            return rule.patternMessage || `${locationLabel} '${field}' has an invalid format`;
        }
    } else if (rule.type === "boolean") {
        if (typeof value !== "boolean" && value !== "true" && value !== "false") {
            return `${locationLabel} '${field}' must be a boolean`;
        }
    }

    // Enum check
    if (rule.enum && !rule.enum.includes(value)) {
        return `${locationLabel} '${field}' must be one of: ${rule.enum.join(", ")}`;
    }

    // Custom validator function
    if (typeof rule.custom === "function") {
        const customResult = rule.custom(value);
        if (customResult !== true) {
            return customResult || `${locationLabel} '${field}' failed custom validation`;
        }
    }

    return null;
}

export default validateRequest;
