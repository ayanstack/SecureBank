import validateRequest from "../middleware/validate.mjs";
import { OTP_PURPOSES } from "../constants/index.mjs";

export const validateCreateOTP = validateRequest({
    disallowUnknownBody: true,
    body: {
        purpose: {
            required: true,
            type: "string",
            enum: Object.values(OTP_PURPOSES),
        },
    },
});

export const validateVerifyOTP = validateRequest({
    disallowUnknownBody: true,
    body: {
        otpId: {
            required: true,
            type: "objectId",
        },
        otp: {
            required: true,
            type: "string",
            pattern: /^\d{6}$/,
            patternMessage: "Field 'otp' must be a 6-digit numeric code",
        },
    },
});

export const validateResendOTP = validateRequest({
    disallowUnknownBody: true,
    body: {
        purpose: {
            required: true,
            type: "string",
            enum: Object.values(OTP_PURPOSES),
        },
    },
});
