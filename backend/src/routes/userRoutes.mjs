import express from "express";
import protect from "../middleware/authMiddleware.mjs";
import {
    getMyProfile,
    updateProfile,
    setTransactionPin,
    verifyTransactionPin,
    changeTransactionPin,
} from "../controllers/userController.mjs";
import {
    validateSetPin,
    validateVerifyPin,
    validateChangePin,
    validateUpdateProfile,
} from "../validators/userValidators.mjs";

const router = express.Router();

router.get("/me", protect, getMyProfile);
router.patch("/profile", protect, validateUpdateProfile, updateProfile);
router.post("/transaction-pin", protect, validateSetPin, setTransactionPin);
router.post("/verify-transaction-pin", protect, validateVerifyPin, verifyTransactionPin);
router.put("/transaction-pin", protect, validateChangePin, changeTransactionPin);

export default router;