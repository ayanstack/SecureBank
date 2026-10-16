import validateRequest from "../middleware/validate.mjs";
import { TRANSACTION_TYPES, TRANSACTION_STATUS } from "../constants/index.mjs";

export const validateDeposit = validateRequest({
    disallowUnknownBody: true,
    body: {
        accountId: {
            required: true,
            type: "objectId",
        },
        amount: {
            required: true,
            type: "number",
            min: 0.01,
            max: 10000000,
        },
        description: {
            required: false,
            type: "string",
            maxLength: 255,
        },
    },
});

export const validateWithdraw = validateRequest({
    disallowUnknownBody: true,
    body: {
        accountId: {
            required: true,
            type: "objectId",
        },
        amount: {
            required: true,
            type: "number",
            min: 0.01,
            max: 10000000,
        },
        description: {
            required: false,
            type: "string",
            maxLength: 255,
        },
    },
});

export const validateTransactionHistory = validateRequest({
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

export const validateTransactionIdParam = validateRequest({
    params: {
        id: {
            required: true,
            type: "objectId",
        },
    },
});
