import express from "express";
import protect from "../middleware/authMiddleware.mjs";
import {
    addBeneficiary,
    getMyBeneficiaries,
    deleteBeneficiary,
    updateBeneficiary,
    activateBeneficiary,
    deactivateBeneficiary,
} from "../controllers/beneficiaryController.mjs";
import {
    validateAddBeneficiary,
    validateUpdateBeneficiary,
    validateBeneficiaryIdParam,
} from "../validators/beneficiaryValidators.mjs";

const router = express.Router();

router.post("/", protect, validateAddBeneficiary, addBeneficiary);
router.get("/", protect, getMyBeneficiaries);
router.delete("/:id", protect, validateBeneficiaryIdParam, deleteBeneficiary);
router.put("/:id", protect, validateUpdateBeneficiary, updateBeneficiary);
router.patch("/:id/activate", protect, validateBeneficiaryIdParam, activateBeneficiary);
router.patch("/:id/deactivate", protect, validateBeneficiaryIdParam, deactivateBeneficiary);

export default router;