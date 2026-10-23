import mongoose from "mongoose";
import Account from "../models/Account.mjs";
import Transaction from "../models/Transaction.mjs";
import {
    roundMoney,
    addMoney,
    subtractMoney,
} from "../utils/money.mjs";
import { TRANSACTION_STATUS } from "../constants/index.mjs";

// Common helpers
const money = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const dateFormat = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN") : "N/A";

// Use actual balance movement to classify deposits and withdrawals.
// Positive movement = credit; negative movement = debit.
const getBalanceChange = (transaction) =>
    roundMoney(Number(transaction.balanceAfter || 0) - Number(transaction.balanceBefore || 0));

const calculateStatementTotals = (transactions) =>
    transactions.reduce(
        (totals, transaction) => {
            if (transaction.status !== TRANSACTION_STATUS.SUCCESS) {
                return totals;
            }

            const delta = getBalanceChange(transaction);

            if (delta > 0) totals.totalCredits = addMoney(totals.totalCredits, delta);
            if (delta < 0) totals.totalDebits = addMoney(totals.totalDebits, Math.abs(delta));

            return totals;
        },
        { totalCredits: 0, totalDebits: 0 }
    );

const getOwnedAccount = async (accountId, userId, fields) => {
    if (!mongoose.Types.ObjectId.isValid(accountId)) {
        return { error: "INVALID_ID" };
    }

    const account = await Account.findOne({
        _id: accountId,
        user: userId,
    }).select(fields);

    return account ? { account } : { error: "NOT_FOUND" };
};

const sendAccountError = (res, error) => {
    if (error === "INVALID_ID") {
        return res.status(400).json({
            success: false,
            message: "Invalid account ID",
        });
    }

    return res.status(404).json({
        success: false,
        message: "Account not found or access denied",
    });
};

// Protect CSV files against spreadsheet formula injection
const safeCSV = (value) => {
    let text = String(value ?? "");

    // Escapes leading characters that could trigger formulas in Excel / LibreOffice
    if (/^[\s]*[=+\-@\t\r]/.test(text)) {
        text = `'${text}`;
    }

    return `"${text.replace(/"/g, '""')}"`;
};

// Shared PDF statement renderer for download and email
const createStatementPDF = async (account, transactions) => {
    const PDFDocument = (await import("pdfkit")).default;
    const chunks = [];

    const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 45, left: 40, right: 40 },
        bufferPages: true,
    });

    const pdfBufferPromise = new Promise((resolve, reject) => {
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });

    const tableX = 40;
    const tableWidth = 515;
    const bottomLimit = 750;

    const columns = [
        { title: "Date", width: 57 },
        { title: "Particulars", width: 155 },
        { title: "Deposits (INR)", width: 78 },
        { title: "Withdrawals (INR)", width: 83 },
        { title: "Balance (INR)", width: 142 },
    ];

    const drawHeader = () => {
        doc.rect(0, 0, 595.28, 105).fill("#123B65");

        doc
            .fillColor("#FFFFFF")
            .font("Helvetica-Bold")
            .fontSize(23)
            .text("SecureBank", 40, 27);

        doc
            .font("Helvetica")
            .fontSize(10)
            .text("ACCOUNT STATEMENT", 40, 59);

        doc
            .fontSize(9)
            .text(
                `Generated: ${new Date().toLocaleDateString("en-IN")}`,
                390,
                35,
                { width: 165, align: "right" }
            );

        doc.fillColor("#222222");
        doc.y = 125;
    };

    const drawAccountSummary = () => {
        doc
            .font("Helvetica-Bold")
            .fontSize(12)
            .fillColor("#123B65")
            .text("ACCOUNT DETAILS", 40, doc.y);

        doc.moveDown(0.6);

        const startY = doc.y;
        const boxHeight = 65;
        const boxWidth = tableWidth / 2;

        const details = [
            [
                `Account Number: ${account.accountNumber}`,
                `Account Type: ${account.accountType}`,
            ],
            [
                `IFSC Code: ${account.ifscCode || "N/A"}`,
                `Account Status: ${account.status}`,
            ],
        ];

        details.forEach((row, index) => {
            const x = tableX + index * boxWidth;

            doc
                .lineWidth(0.6)
                .strokeColor("#D4DCE5")
                .rect(x, startY, boxWidth, boxHeight)
                .stroke();

            doc
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#333333")
                .text(row[0], x + 10, startY + 15, {
                    width: boxWidth - 20,
                })
                .text(row[1], x + 10, startY + 38, {
                    width: boxWidth - 20,
                });
        });

        doc.y = startY + boxHeight + 20;

        doc
            .font("Helvetica-Bold")
            .fontSize(10)
            .fillColor("#123B65")
            .text(
                `Available Balance: INR ${money(account.balance)}`,
                40,
                doc.y
            );

        doc.moveDown(1.5);
    };

    const drawTableHeader = () => {
        const y = doc.y;
        doc.rect(tableX, y, tableWidth, 28).fill("#E8EDF3");

        let x = tableX;

        columns.forEach((column) => {
            doc
                .font("Helvetica-Bold")
                .fontSize(8)
                .fillColor("#123B65")
                .text(column.title, x + 4, y + 9, {
                    width: column.width - 8,
                    align:
                        column.title === "Particulars" ||
                        column.title === "Date"
                            ? "left"
                            : "right",
                });

            x += column.width;
        });

        doc.y = y + 28;
    };

    const drawRow = (row, index) => {
        const rowHeight = 28;

        if (doc.y + rowHeight > bottomLimit) {
            doc.addPage();
            drawHeader();
            drawTableHeader();
        }

        const y = doc.y;

        if (index % 2 === 1) {
            doc.rect(tableX, y, tableWidth, rowHeight).fill("#F9FBFD");
        }

        let x = tableX;

        row.forEach((cell, cellIndex) => {
            const column = columns[cellIndex];

            doc
                .font("Helvetica")
                .fontSize(8)
                .fillColor("#222222")
                .text(cell, x + 4, y + 8, {
                    width: column.width - 8,
                    align:
                        cellIndex === 0 || cellIndex === 1
                            ? "left"
                            : "right",
                });

            x += column.width;
        });

        doc
            .lineWidth(0.4)
            .strokeColor("#E6EDF5")
            .moveTo(tableX, y + rowHeight)
            .lineTo(tableX + tableWidth, y + rowHeight)
            .stroke();

        doc.y = y + rowHeight;
    };

    drawHeader();
    drawAccountSummary();
    drawTableHeader();

    if (transactions.length === 0) {
        doc.moveDown(1);
        doc
            .font("Helvetica-Oblique")
            .fontSize(9)
            .fillColor("#666666")
            .text("No transactions found for this period.", tableX, doc.y, {
                width: tableWidth,
                align: "center",
            });
    } else {
        transactions.forEach((tx, index) => {
            const delta = getBalanceChange(tx);
            const isDeposit = delta > 0;
            const isWithdrawal = delta < 0;

            const row = [
                dateFormat(tx.createdAt),
                tx.description || tx.type || "Transaction",
                isDeposit ? money(delta) : "-",
                isWithdrawal ? money(Math.abs(delta)) : "-",
                money(tx.balanceAfter),
            ];

            drawRow(row, index);
        });
    }

    doc.end();
    return pdfBufferPromise;
};

// ==========================================
// 1. Get Account Statement (Paginated + Filter)
// ==========================================
export const getAccountStatement = async (req, res) => {
    try {
        const { accountId } = req.params;
        const {
            page = 1,
            limit = 10,
            type,
            status,
            startDate,
            endDate,
            search,
        } = req.query;

        const result = await getOwnedAccount(
            accountId,
            req.user.userId,
            "_id accountNumber accountType balance status isPrimary ifscCode"
        );

        if (result.error) {
            return sendAccountError(res, result.error);
        }

        const { account } = result;

        const currentPage = Math.max(1, parseInt(page, 10) || 1);
        const perPage = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const skip = (currentPage - 1) * perPage;

        const filter = {
            account: accountId,
            user: req.user.userId,
        };

        if (type) filter.type = type.toUpperCase();
        if (status) filter.status = status.toUpperCase();

        if (startDate || endDate) {
            filter.createdAt = {};

            if (startDate) {
                const start = new Date(startDate);
                if (Number.isNaN(start.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid startDate",
                    });
                }
                start.setHours(0, 0, 0, 0);
                filter.createdAt.$gte = start;
            }

            if (endDate) {
                const end = new Date(endDate);
                if (Number.isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid endDate",
                    });
                }
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }

            if (
                filter.createdAt.$gte &&
                filter.createdAt.$lte &&
                filter.createdAt.$gte > filter.createdAt.$lte
            ) {
                return res.status(400).json({
                    success: false,
                    message: "startDate cannot be after endDate",
                });
            }
        }

        if (search) {
            const escapedSearch = String(search).replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            filter.$or = [
                { reference: { $regex: escapedSearch, $options: "i" } },
                { description: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        const totalTransactions = await Transaction.countDocuments(filter);

        const transactions = await Transaction.find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .skip(skip)
            .limit(perPage)
            .select("_id type amount balanceBefore balanceAfter status reference description createdAt")
            .lean();

        const totalPages = Math.ceil(totalTransactions / perPage);

        return res.status(200).json({
            success: true,
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                balance: roundMoney(account.balance),
                status: account.status,
                isPrimary: account.isPrimary,
                ifscCode: account.ifscCode,
            },
            statement: {
                transactions: transactions.map((t) => ({
                    id: t._id,
                    type: t.type,
                    amount: roundMoney(t.amount),
                    balanceBefore: roundMoney(t.balanceBefore),
                    balanceAfter: roundMoney(t.balanceAfter),
                    status: t.status,
                    reference: t.reference,
                    description: t.description,
                    createdAt: t.createdAt,
                })),
            },
            pagination: {
                currentPage,
                perPage,
                totalTransactions,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1,
            },
        });
    } catch (error) {
        console.error("Get account statement error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ==========================================
// 2. Get Statement Summary
// ==========================================
export const getStatementSummary = async (req, res) => {
    try {
        const { accountId } = req.params;

        const result = await getOwnedAccount(
            accountId,
            req.user.userId,
            "_id accountNumber accountType balance status isPrimary ifscCode"
        );

        if (result.error) {
            return sendAccountError(res, result.error);
        }

        const { account } = result;

        const transactions = await Transaction.find({
            account: accountId,
            user: req.user.userId,
            status: TRANSACTION_STATUS.SUCCESS,
        })
            .sort({ createdAt: 1, _id: 1 })
            .select("type amount balanceBefore balanceAfter status createdAt")
            .lean();

        const { totalCredits, totalDebits } = calculateStatementTotals(transactions);

        const openingBalance =
            transactions.length > 0
                ? roundMoney(Number(transactions[0].balanceBefore || 0))
                : roundMoney(Number(account.balance || 0));

        return res.status(200).json({
            success: true,
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                status: account.status,
                isPrimary: account.isPrimary,
                ifscCode: account.ifscCode,
            },
            summary: {
                openingBalance,
                closingBalance: roundMoney(account.balance),
                totalCredits,
                totalDebits,
                netChange: roundMoney(subtractMoney(totalCredits, totalDebits)),
                transactionCount: transactions.length,
            },
        });
    } catch (error) {
        console.error("Get statement summary error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ==========================================
// 3. Get Mini Statement (Latest 5 Transactions)
// ==========================================
export const getMiniStatement = async (req, res) => {
    try {
        const { accountId } = req.params;

        const result = await getOwnedAccount(
            accountId,
            req.user.userId,
            "_id accountNumber accountType balance status"
        );

        if (result.error) {
            return sendAccountError(res, result.error);
        }

        const { account } = result;

        const transactions = await Transaction.find({
            account: accountId,
            user: req.user.userId,
        })
            .sort({ createdAt: -1, _id: -1 })
            .limit(5)
            .select("_id type amount status reference description balanceBefore balanceAfter createdAt")
            .lean();

        return res.status(200).json({
            success: true,
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                balance: roundMoney(account.balance),
                status: account.status,
            },
            miniStatement: {
                transactionCount: transactions.length,
                transactions: transactions.map((t) => ({
                    id: t._id,
                    type: t.type,
                    amount: roundMoney(t.amount),
                    status: t.status,
                    reference: t.reference,
                    description: t.description,
                    balanceBefore: roundMoney(t.balanceBefore),
                    balanceAfter: roundMoney(t.balanceAfter),
                    createdAt: t.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error("Get mini statement error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
};

// ==========================================
// 4. Download Account Statement as CSV
// ==========================================
export const downloadStatementCSV = async (req, res) => {
    try {
        const { accountId } = req.params;

        const result = await getOwnedAccount(
            accountId,
            req.user.userId,
            "_id accountNumber accountType"
        );

        if (result.error) {
            return sendAccountError(res, result.error);
        }

        const { account } = result;

        const transactions = await Transaction.find({
            account: accountId,
            user: req.user.userId,
        })
            .sort({ createdAt: -1, _id: -1 })
            .select("type amount balanceBefore balanceAfter status reference description createdAt")
            .lean();

        const headers = [
            "Date",
            "Type",
            "Reference",
            "Description",
            "Amount",
            "Balance Before",
            "Balance After",
            "Status",
        ];

        const rows = transactions.map((tx) => [
            tx.createdAt ? new Date(tx.createdAt).toISOString() : "",
            tx.type,
            tx.reference,
            tx.description || "",
            roundMoney(tx.amount),
            roundMoney(tx.balanceBefore),
            roundMoney(tx.balanceAfter),
            tx.status,
        ]);

        const csvContent = [
            headers.map(safeCSV).join(","),
            ...rows.map((row) => row.map(safeCSV).join(",")),
        ].join("\r\n");

        const filename = `SecureBank-Statement-${account.accountNumber}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

        return res.status(200).send("\uFEFF" + csvContent);
    } catch (error) {
        console.error("Download CSV statement error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to download statement",
        });
    }
};

// ==========================================
// 5. Download Account Statement as PDF
// ==========================================
export const downloadStatementPDF = async (req, res) => {
    try {
        const { accountId } = req.params;

        const result = await getOwnedAccount(
            accountId,
            req.user.userId,
            "_id accountNumber accountType balance status ifscCode"
        );

        if (result.error) {
            return sendAccountError(res, result.error);
        }

        const { account } = result;

        const transactions = await Transaction.find({
            account: accountId,
            user: req.user.userId,
        })
            .sort({ createdAt: 1, _id: 1 })
            .select("type amount balanceBefore balanceAfter status reference description createdAt")
            .lean();

        const pdfBuffer = await createStatementPDF(account, transactions);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="SecureBank-Statement-${account.accountNumber}.pdf"`
        );

        return res.status(200).send(pdfBuffer);
    } catch (error) {
        console.error("Download PDF statement error:", error.message);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Unable to download statement PDF",
            });
        }

        res.destroy(error);
    }
};

// ==========================================
// 6. Email Account Statement as PDF
// ==========================================
export const emailAccountStatement = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { email } = req.body;

        if (
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid email address",
            });
        }

        const result = await getOwnedAccount(
            accountId,
            req.user.userId,
            "_id accountNumber accountType balance status ifscCode"
        );

        if (result.error) {
            return sendAccountError(res, result.error);
        }

        const { account } = result;

        const transactions = await Transaction.find({
            account: accountId,
            user: req.user.userId,
        })
            .sort({ createdAt: 1, _id: 1 })
            .select("type amount balanceBefore balanceAfter status reference description createdAt")
            .lean();

        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            return res.status(503).json({
                success: false,
                message: "Email service is not configured in environment",
            });
        }

        const pdfBuffer = await createStatementPDF(account, transactions);

        const nodemailer = (await import("nodemailer")).default;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: `"SecureBank" <${process.env.EMAIL_USER}>`,
            to: email.trim(),
            subject: "Your SecureBank Account Statement",
            text: `Your account statement for account ending ${account.accountNumber.slice(-4)} is attached as a PDF.`,
            attachments: [
                {
                    filename: `SecureBank-Statement-${account.accountNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

        return res.status(200).json({
            success: true,
            message: "Account statement emailed successfully",
        });
    } catch (error) {
        console.error("Email statement error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Unable to email account statement",
        });
    }
};

// ==========================================
// 7. Get Monthly Statement
// ==========================================
export const getMonthlyStatement = async (req, res) => {
    try {
        const { accountId } = req.params;
        const { month, year } = req.query;

        const monthNumber = Number(month);
        const yearNumber = Number(year);

        if (
            month === undefined ||
            year === undefined ||
            !Number.isInteger(monthNumber) ||
            monthNumber < 1 ||
            monthNumber > 12 ||
            !Number.isInteger(yearNumber) ||
            yearNumber < 2000 ||
            yearNumber > 2100
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid month (1-12) and year (2000-2100) are required.",
            });
        }

        const result = await getOwnedAccount(
            accountId,
            req.user.userId,
            "_id accountNumber accountType balance status isPrimary ifscCode"
        );

        if (result.error) {
            return sendAccountError(res, result.error);
        }

        const { account } = result;

        const startDate = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
        const endDate = new Date(Date.UTC(yearNumber, monthNumber, 1));

        const transactions = await Transaction.find({
            account: account._id,
            user: req.user.userId,
            createdAt: {
                $gte: startDate,
                $lt: endDate,
            },
        })
            .sort({ createdAt: -1, _id: -1 })
            .select("_id type amount balanceBefore balanceAfter status reference description createdAt")
            .lean();

        const successfulTransactions = transactions.filter(
            (t) => t.status === TRANSACTION_STATUS.SUCCESS
        );

        const { totalCredits, totalDebits } = calculateStatementTotals(successfulTransactions);

        return res.status(200).json({
            success: true,
            account: {
                id: account._id,
                accountNumber: account.accountNumber,
                accountType: account.accountType,
                balance: roundMoney(account.balance),
                status: account.status,
                isPrimary: account.isPrimary,
                ifscCode: account.ifscCode,
            },
            period: {
                month: monthNumber,
                year: yearNumber,
                startDate,
                endDate,
            },
            monthlyStatement: {
                transactionCount: transactions.length,
                successfulTransactionCount: successfulTransactions.length,
                totalCredits,
                totalDebits,
                netChange: roundMoney(subtractMoney(totalCredits, totalDebits)),
                transactions: transactions.map((t) => ({
                    id: t._id,
                    type: t.type,
                    amount: roundMoney(t.amount),
                    balanceBefore: roundMoney(t.balanceBefore),
                    balanceAfter: roundMoney(t.balanceAfter),
                    status: t.status,
                    reference: t.reference,
                    description: t.description,
                    createdAt: t.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error("Monthly statement error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to generate monthly statement.",
        });
    }
};
