import User from "../models/User.mjs";
import Account from "../models/Account.mjs";
import Transaction from "../models/Transaction.mjs";
import { roundMoney, addMoney } from "../utils/money.mjs";
import { ACCOUNT_STATUS } from "../constants/index.mjs";

export const getDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).select(
            "firstName lastName email role"
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const accounts = await Account.find({
            user: userId,
            status: { $ne: ACCOUNT_STATUS.CLOSED },
        }).select("_id accountNumber accountType balance status isPrimary createdAt");

        const totalBalance = accounts.reduce(
            (total, account) => addMoney(total, account.balance),
            0
        );

        const activeAccounts = accounts.filter(
            (account) => account.status === ACCOUNT_STATUS.ACTIVE
        ).length;

        const recentTransactions = await Transaction.find({
            user: userId,
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select("_id type amount status reference description createdAt")
            .lean();

        return res.status(200).json({
            success: true,
            dashboard: {
                user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                },

                summary: {
                    totalAccounts: accounts.length,
                    activeAccounts,
                    totalBalance: roundMoney(totalBalance),
                    recentTransactionsCount: recentTransactions.length,
                },

                accounts: accounts.map((acc) => ({
                    id: acc._id,
                    accountNumber: acc.accountNumber,
                    accountType: acc.accountType,
                    balance: roundMoney(acc.balance),
                    status: acc.status,
                    isPrimary: acc.isPrimary,
                    createdAt: acc.createdAt,
                })),

                recentTransactions: recentTransactions.map((tx) => ({
                    id: tx._id,
                    type: tx.type,
                    amount: roundMoney(tx.amount),
                    status: tx.status,
                    reference: tx.reference,
                    description: tx.description,
                    createdAt: tx.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error("Dashboard error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};