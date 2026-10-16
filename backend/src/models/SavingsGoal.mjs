import mongoose from "mongoose";

const savingsGoalSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Savings goal must belong to a user"],
            index: true,
        },
        account: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null,
        },
        title: {
            type: String,
            required: [true, "Goal title is required"],
            trim: true,
            maxlength: [100, "Goal title cannot exceed 100 characters"],
        },
        category: {
            type: String,
            enum: ["Emergency", "Vacation", "Home", "Vehicle", "Education", "Gadget", "Investment", "Other"],
            default: "Other",
        },
        targetAmount: {
            type: Number,
            required: [true, "Target amount is required"],
            min: [100, "Target amount must be at least ₹100"],
        },
        currentAmount: {
            type: Number,
            default: 0,
            min: [0, "Current amount cannot be negative"],
        },
        targetDate: {
            type: Date,
            required: [true, "Target date is required"],
        },
        status: {
            type: String,
            enum: ["IN_PROGRESS", "ACHIEVED", "CANCELLED"],
            default: "IN_PROGRESS",
            index: true,
        },
        notes: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

savingsGoalSchema.index({ user: 1, status: 1 });

const SavingsGoal = mongoose.model("SavingsGoal", savingsGoalSchema);
export default SavingsGoal;
