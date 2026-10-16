import mongoose from "mongoose";
import Beneficiary from "../models/Beneficiary.mjs";
import Account from "../models/Account.mjs";
import { BENEFICIARY_STATUS } from "../constants/index.mjs";

// =========================
// ADD BENEFICIARY
// =========================
export const addBeneficiary = async (req, res) => {
    try {
        const { name, accountNumber, ifscCode } = req.body;

        if (!name || !accountNumber || !ifscCode) {
            return res.status(400).json({
                success: false,
                message: "Name, account number and IFSC code are required",
            });
        }

        const trimmedName = name.trim();
        const trimmedAccount = accountNumber.trim();
        const normalizedIfsc = ifscCode.trim().toUpperCase();

        // Check if user is attempting to add their own account as beneficiary
        const ownAccount = await Account.findOne({
            user: req.user.userId,
            accountNumber: trimmedAccount,
        });

        if (ownAccount) {
            return res.status(400).json({
                success: false,
                message: "You cannot add your own bank account as a beneficiary",
            });
        }

        // Check if beneficiary already exists for this user
        const existingBeneficiary = await Beneficiary.findOne({
            user: req.user.userId,
            accountNumber: trimmedAccount,
        });

        if (existingBeneficiary) {
            return res.status(409).json({
                success: false,
                message: "Beneficiary with this account number already exists",
            });
        }

        const beneficiary = await Beneficiary.create({
            user: req.user.userId,
            name: trimmedName,
            accountNumber: trimmedAccount,
            ifscCode: normalizedIfsc,
            status: BENEFICIARY_STATUS.ACTIVE,
        });

        return res.status(201).json({
            success: true,
            message: "Beneficiary added successfully",
            beneficiary: {
                id: beneficiary._id,
                name: beneficiary.name,
                accountNumber: beneficiary.accountNumber,
                ifscCode: beneficiary.ifscCode,
                status: beneficiary.status,
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Beneficiary with this account number already exists",
            });
        }

        console.error("Add beneficiary error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// GET MY BENEFICIARIES
// =========================
export const getMyBeneficiaries = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        const filter = {
            user: req.user.userId,
        };

        if (status && Object.values(BENEFICIARY_STATUS).includes(status.toUpperCase())) {
            filter.status = status.toUpperCase();
        }

        const pageNumber = Math.max(1, parseInt(page, 10) || 1);
        const limitNumber = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

        const totalBeneficiaries = await Beneficiary.countDocuments(filter);
        const beneficiaries = await Beneficiary.find(filter)
            .select("name accountNumber ifscCode status createdAt")
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber)
            .lean();

        return res.status(200).json({
            success: true,
            count: beneficiaries.length,
            pagination: {
                currentPage: pageNumber,
                limit: limitNumber,
                totalBeneficiaries,
                totalPages: Math.ceil(totalBeneficiaries / limitNumber),
            },
            beneficiaries: beneficiaries.map((b) => ({
                id: b._id,
                name: b.name,
                accountNumber: b.accountNumber,
                ifscCode: b.ifscCode,
                status: b.status,
                createdAt: b.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get beneficiaries error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// DELETE BENEFICIARY
// =========================
export const deleteBeneficiary = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid beneficiary ID",
            });
        }

        const beneficiary = await Beneficiary.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: "Beneficiary not found",
            });
        }

        await Beneficiary.deleteOne({
            _id: id,
            user: req.user.userId,
        });

        return res.status(200).json({
            success: true,
            message: "Beneficiary deleted successfully",
        });
    } catch (error) {
        console.error("Delete beneficiary error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// UPDATE BENEFICIARY
// =========================
export const updateBeneficiary = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, accountNumber, ifscCode } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid beneficiary ID",
            });
        }

        if (!name || !accountNumber || !ifscCode) {
            return res.status(400).json({
                success: false,
                message: "Name, account number and IFSC code are required",
            });
        }

        const beneficiary = await Beneficiary.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: "Beneficiary not found",
            });
        }

        const trimmedAccount = accountNumber.trim();

        // Check if updating to an account number that already exists on another beneficiary of this user
        if (trimmedAccount !== beneficiary.accountNumber) {
            const conflict = await Beneficiary.findOne({
                user: req.user.userId,
                accountNumber: trimmedAccount,
                _id: { $ne: id },
            });

            if (conflict) {
                return res.status(409).json({
                    success: false,
                    message: "Another beneficiary with this account number already exists",
                });
            }
        }

        beneficiary.name = name.trim();
        beneficiary.accountNumber = trimmedAccount;
        beneficiary.ifscCode = ifscCode.trim().toUpperCase();

        await beneficiary.save();

        return res.status(200).json({
            success: true,
            message: "Beneficiary updated successfully",
            beneficiary: {
                id: beneficiary._id,
                name: beneficiary.name,
                accountNumber: beneficiary.accountNumber,
                ifscCode: beneficiary.ifscCode,
                status: beneficiary.status,
            },
        });
    } catch (error) {
        console.error("Update beneficiary error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// ACTIVATE BENEFICIARY
// =========================
export const activateBeneficiary = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid beneficiary ID",
            });
        }

        const beneficiary = await Beneficiary.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: "Beneficiary not found",
            });
        }

        if (beneficiary.status === BENEFICIARY_STATUS.ACTIVE) {
            return res.status(400).json({
                success: false,
                message: "Beneficiary is already active",
            });
        }

        beneficiary.status = BENEFICIARY_STATUS.ACTIVE;
        await beneficiary.save();

        return res.status(200).json({
            success: true,
            message: "Beneficiary activated successfully",
            beneficiary: {
                id: beneficiary._id,
                name: beneficiary.name,
                accountNumber: beneficiary.accountNumber,
                ifscCode: beneficiary.ifscCode,
                status: beneficiary.status,
            },
        });
    } catch (error) {
        console.error("Activate beneficiary error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// =========================
// DEACTIVATE BENEFICIARY
// =========================
export const deactivateBeneficiary = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid beneficiary ID",
            });
        }

        const beneficiary = await Beneficiary.findOne({
            _id: id,
            user: req.user.userId,
        });

        if (!beneficiary) {
            return res.status(404).json({
                success: false,
                message: "Beneficiary not found",
            });
        }

        if (beneficiary.status === BENEFICIARY_STATUS.INACTIVE) {
            return res.status(400).json({
                success: false,
                message: "Beneficiary is already inactive",
            });
        }

        beneficiary.status = BENEFICIARY_STATUS.INACTIVE;
        await beneficiary.save();

        return res.status(200).json({
            success: true,
            message: "Beneficiary deactivated successfully",
            beneficiary: {
                id: beneficiary._id,
                name: beneficiary.name,
                accountNumber: beneficiary.accountNumber,
                ifscCode: beneficiary.ifscCode,
                status: beneficiary.status,
            },
        });
    } catch (error) {
        console.error("Deactivate beneficiary error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};