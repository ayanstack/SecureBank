import validateRequest from "../middleware/validate.mjs";

const pinRegex = /^\d{4}$/;

export const validateSetPin = validateRequest({
    disallowUnknownBody: true,
    body: {
        pin: {
            required: true,
            type: "string",
            pattern: pinRegex,
            patternMessage: "Field 'pin' must be exactly 4 digits",
        },
    },
});

export const validateVerifyPin = validateRequest({
    disallowUnknownBody: true,
    body: {
        pin: {
            required: true,
            type: "string",
            pattern: pinRegex,
            patternMessage: "Field 'pin' must be exactly 4 digits",
        },
    },
});

export const validateChangePin = validateRequest({
    disallowUnknownBody: true,
    body: {
        currentPin: {
            required: true,
            type: "string",
            pattern: pinRegex,
            patternMessage: "Field 'currentPin' must be exactly 4 digits",
        },
        newPin: {
            required: true,
            type: "string",
            pattern: pinRegex,
            patternMessage: "Field 'newPin' must be exactly 4 digits",
        },
    },
});

export const validateUpdateProfile = validateRequest({
    disallowUnknownBody: true,
    body: {
        firstName: {
            required: false,
            type: "string",
            minLength: 2,
            maxLength: 50,
        },
        lastName: {
            required: false,
            type: "string",
            minLength: 1,
            maxLength: 50,
        },
    },
});
