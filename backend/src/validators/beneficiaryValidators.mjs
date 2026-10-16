import validateRequest from "../middleware/validate.mjs";

const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const validateAddBeneficiary = validateRequest({
    disallowUnknownBody: true,
    body: {
        name: {
            required: true,
            type: "string",
            minLength: 2,
            maxLength: 100,
        },
        accountNumber: {
            required: true,
            type: "string",
            minLength: 6,
            maxLength: 34,
        },
        ifscCode: {
            required: true,
            type: "string",
            pattern: ifscRegex,
            patternMessage: "Field 'ifscCode' must be valid 11-character Indian Financial System Code (e.g. SECB0000001)",
        },
    },
});

export const validateUpdateBeneficiary = validateRequest({
    params: {
        id: {
            required: true,
            type: "objectId",
        },
    },
    disallowUnknownBody: true,
    body: {
        name: {
            required: true,
            type: "string",
            minLength: 2,
            maxLength: 100,
        },
        accountNumber: {
            required: true,
            type: "string",
            minLength: 6,
            maxLength: 34,
        },
        ifscCode: {
            required: true,
            type: "string",
            pattern: ifscRegex,
            patternMessage: "Field 'ifscCode' must be valid 11-character Indian Financial System Code (e.g. SECB0000001)",
        },
    },
});

export const validateBeneficiaryIdParam = validateRequest({
    params: {
        id: {
            required: true,
            type: "objectId",
        },
    },
});
