/**
 * Financial Calculation & Monetary Utilities
 * Handles exact integer minor-unit (cents/paise) representation to avoid IEEE 754 floating-point errors.
 */

// Convert currency amount to integer minor units (paise/cents)
export const toMinorUnits = (amount) => {
    const num = Number(amount);
    if (!Number.isFinite(num)) {
        throw new TypeError("Invalid monetary amount: must be finite");
    }
    return Math.round((num + Number.EPSILON) * 100);
};

// Convert integer minor units back to 2-decimal rounded number
export const fromMinorUnits = (minorUnits) => {
    return Math.round(minorUnits) / 100;
};

// Round any monetary number to standard 2-decimal places safely
export const roundMoney = (amount) => {
    return fromMinorUnits(toMinorUnits(amount));
};

// Safe addition of monetary values
export const addMoney = (a, b) => {
    return fromMinorUnits(toMinorUnits(a) + toMinorUnits(b));
};

// Safe subtraction of monetary values
export const subtractMoney = (a, b) => {
    return fromMinorUnits(toMinorUnits(a) - toMinorUnits(b));
};

// Safe comparison: returns true if a >= b
export const hasSufficientBalance = (balance, requiredAmount) => {
    return toMinorUnits(balance) >= toMinorUnits(requiredAmount);
};

// Validate positive monetary amount within permissible bounds
export const isValidAmount = (amount, min = 0.01, max = 10000000) => {
    if (amount === undefined || amount === null || amount === "") {
        return false;
    }
    const num = Number(amount);
    return Number.isFinite(num) && num >= min && num <= max;
};

// Format as Indian Rupee (INR) representation
export const formatCurrency = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};