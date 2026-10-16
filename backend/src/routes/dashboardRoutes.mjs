import express from "express";
import protect from "../middleware/authMiddleware.mjs";
import { getDashboard } from "../controllers/dashboardController.mjs";

const router = express.Router()

router.get("/", protect, getDashboard)

export default router