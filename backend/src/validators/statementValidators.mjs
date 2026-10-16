import validateRequest from "../middleware/validate.mjs";
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from "../constants/index.mjs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateAccountIdParam = validateRequest({
    params: {
        accountId: {
            required: true,
            type: "objectId",
        },
    },
});

export const validateEmailStatement = validateRequest({
    params: {
        accountId: {
            required: true,
            type: "objectId",
        },
    },
    disallowUnknownBody: true,
    body: {
        email: {
            required: true,
            type: "string",
            pattern: emailRegex,
            patternMessage: "Field 'email' must be a valid email address",
        },
    },
});

export const validateMonthlyStatement = validateRequest({
    params: {
        accountId: {
            required: true,
            type: "objectId",
        },
    },
    query: {
        month: {
            required: true,
            type: "number",
            min: 1,
            max: 12,
        },
        year: {
            required: true,
            type: "number",
            min: 2000,
            max: 2100,
        },
    },
});

export const validateStatementQuery = validateRequest({
    params: {
        accountId: {
            required: true,
            type: "objectId",
        },
    },
    query: {
        type: {
            required: false,
            type: "string",
            enum: Object.values(TRANSACTION_TYPES),
        },
        status: {
            required: false,
            type: "string",
            enum: Object.values(TRANSACTION_STATUS),
        },
        page: {
            required: false,
            type: "number",
            min: 1,
        },
        limit: {
            required: false,
            type: "number",
            min: 1,
            max: 100,
        },
    },
});
