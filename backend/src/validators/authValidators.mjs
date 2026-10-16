
import validateRequest from "../middleware/validate.mjs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9]{7,15}$/;

export const validateRegister = validateRequest({
    disallowUnknownBody: true,
    body: {
        firstName: {
            required: true,
            type: "string",
            minLength: 2,
            maxLength: 50,
        },
        lastName: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 50,
        },
        email: {
            required: true,
            type: "string",
            pattern: emailRegex,
            patternMessage: "Field 'email' must be a valid email address",
        },
        password: {
            required: true,
            type: "string",
            minLength: 8,
            maxLength: 128,
        },
        phone: {
            required: true,
            type: "string",
            pattern: phoneRegex,
            patternMessage:
                "Field 'phone' must be a valid phone number (7-15 digits)",
        },
    },
});

export const validateLogin = validateRequest({
    disallowUnknownBody: true,
    body: {
        email: {
            required: true,
            type: "string",
            pattern: emailRegex,
            patternMessage: "Field 'email' must be a valid email address",
        },
        password: {
            required: true,
            type: "string",
            minLength: 1,
            maxLength: 128,
        },
    },
});

export const validateChangePassword = validateRequest({
    disallowUnknownBody: true,
    body: {
        currentPassword: {
            required: true,
            type: "string",
            minLength: 1,
        },
        newPassword: {
            required: true,
            type: "string",
            minLength: 8,
            maxLength: 128,
        },
    },
});

export const validateForgotPassword = validateRequest({
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

export const validateResetPassword = validateRequest({
    disallowUnknownBody: true,
    body: {
        resetToken: {
            required: true,
            type: "string",
            minLength: 1,
        },
        newPassword: {
            required: true,
            type: "string",
            minLength: 8,
            maxLength: 128,
        },
    },
});

export const validateVerifyEmail = validateRequest({
    disallowUnknownBody: true,
    body: {
        verificationToken: {
            required: true,
            type: "string",
            minLength: 1,
        },
    },
});

export const validateResendVerification = validateRequest({
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

export const validateRefreshToken = validateRequest({
    disallowUnknownBody: true,
    body: {
        refreshToken: {
            required: true,
            type: "string",
            minLength: 1,
        },
    },
});
