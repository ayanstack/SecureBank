import validateRequest from "../middleware/validate.mjs";
import { ACCOUNT_TYPES } from "../constants/index.mjs";

export const validateCreateAccount = validateRequest({
    disallowUnknownBody: true,
    body: {
        accountType: {
            required: true,
            type: "string",
            enum: Object.values(ACCOUNT_TYPES),
        },
    },
});

export const validateAccountIdParam = validateRequest({
    params: {
        id: {
            required: true,
            type: "objectId",
        },
    },
});
