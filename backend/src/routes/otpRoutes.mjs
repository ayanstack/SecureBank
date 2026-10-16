import express from "express";
import protect from "../middleware/authMiddleware.mjs";
import {
    createOTP,
    resendOTP,
    verifyOTP,
} from "../controllers/otpController.mjs";
import {
    validateCreateOTP,
    validateVerifyOTP,
    validateResendOTP,
} from "../validators/otpValidators.mjs";

const router = express.Router();

router.post("/", protect, validateCreateOTP, createOTP);
router.post("/verify", protect, validateVerifyOTP, verifyOTP);
router.post("/resend", protect, validateResendOTP, resendOTP);

export default router;