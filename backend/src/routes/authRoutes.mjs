import express from "express";
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
} from "../controllers/authController.mjs";
import protect from "../middleware/authMiddleware.mjs";
import {
    validateRegister,
    validateLogin,
    validateChangePassword,
    validateForgotPassword,
    validateResetPassword,
    validateVerifyEmail,
    validateResendVerification,
    validateRefreshToken,
} from "../validators/authValidators.mjs";

const router = express.Router();

router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/refresh", validateRefreshToken, refreshAccessToken);
router.post("/logout", logoutUser);
router.put("/change-password", protect, validateChangePassword, changePassword);
router.post("/forgot-password", validateForgotPassword, forgotPassword);
router.post("/reset-password", validateResetPassword, resetPassword);
router.post("/verify-email", validateVerifyEmail, verifyEmail);
router.post("/resend-verification", validateResendVerification, resendVerification);

export default router;