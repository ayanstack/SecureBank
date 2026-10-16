import validateRequest from "../middleware/validate.mjs";

const pinRegex = /^\d{4}$/;

export const validateCreateTransfer = validateRequest({
    disallowUnknownBody: true,
    body: {
        senderAccountId: {
            required: true,
            type: "objectId",
        },
        beneficiaryId: {
            required: true,
            type: "objectId",
        },
        amount: {
            required: true,
            type: "number",
            min: 0.01,
            max: 50000,
        },
        transactionPin: {
            required: true,
            type: "string",
            pattern: pinRegex,
            patternMessage: "Field 'transactionPin' must be exactly 4 digits",
        },
        description: {
            required: false,
            type: "string",
            maxLength: 255,
        },
        idempotencyKey: {
            required: false,
            type: "string",
            maxLength: 128,
        },
    },
});

export const validateTransferIdParam = validateRequest({
    params: {
        id: {
            required: true,
            type: "objectId",
        },
    },
});
