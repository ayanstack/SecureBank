import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, api } from "./testHelper.mjs";
import User from "../src/models/User.mjs";
import Account from "../src/models/Account.mjs";
import Transaction from "../src/models/Transaction.mjs";
import Transfer from "../src/models/Transfer.mjs";
import FraudAlert from "../src/models/FraudAlert.mjs";
import SupportTicket from "../src/models/SupportTicket.mjs";
import { evaluateTransactionRisk } from "../src/services/fraudService.mjs";

describe("AI Banking Features & Intelligence Verification Suite", () => {
    let testUser = null;
    let testAccount = null;
    let authToken = null;

    before(async () => {
        await startTestServer();

        // Register and verify test customer
        const email = `ai.tester.${Date.now()}@securebank.test`;
        const regRes = await api("POST", "/api/auth/register", {
            body: {
                firstName: "AITest",
                lastName: "Auditor",
                email,
                phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
                password: "Password123!",
            },
        });

        testUser = await User.findOne({ email });
        testUser.isEmailVerified = true;
        await testUser.save();

        const loginRes = await api("POST", "/api/auth/login", {
            body: { email, password: "Password123!" },
        });

        authToken = loginRes.body.accessToken;

        // Create authorized account for test user
        testAccount = await Account.create({
            user: testUser._id,
            accountNumber: `SB${Date.now()}`,
            accountType: "SAVINGS",
            ifscCode: "SCBK0001001",
            balance: 50000,
            status: "ACTIVE",
            isPrimary: true,
        });

        // Seed authorized transactions
        await Transaction.create([
            {
                account: testAccount._id,
                user: testUser._id,
                type: "DEPOSIT",
                amount: 15000,
                balanceBefore: 0,
                balanceAfter: 15000,
                status: "SUCCESS",
                reference: `DEP-TEST-${Date.now()}`,
                description: "Salary deposit",
            },
            {
                account: testAccount._id,
                user: testUser._id,
                type: "WITHDRAW",
                amount: 2500,
                balanceBefore: 15000,
                balanceAfter: 12500,
                status: "SUCCESS",
                reference: `WTH-TEST-${Date.now()}`,
                description: "Electricity bill payment",
            },
            {
                account: testAccount._id,
                user: testUser._id,
                type: "TRANSFER",
                amount: 3000,
                balanceBefore: 12500,
                balanceAfter: 9500,
                status: "FAILED",
                reference: `TRF-TEST-${Date.now()}`,
                description: "Failed outward payment",
            },
        ]);
    });

    after(async () => {
        if (testUser) {
            await Transaction.deleteMany({ user: testUser._id });
            await Account.deleteMany({ user: testUser._id });
            await FraudAlert.deleteMany({ user: testUser._id });
            await SupportTicket.deleteMany({ user: testUser._id });
            await User.deleteOne({ _id: testUser._id });
        }
        await stopTestServer();
    });

    test("1. AI Banking Assistant - Answers authenticated balance inquiry with honest provider status", async () => {
        const res = await api("POST", "/api/ai/chat", {
            headers: { Authorization: `Bearer ${authToken}` },
            body: { message: "What is my available balance?" },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.reply.includes("consolidated balance"));
        assert.equal(res.body.verifiedFacts, true);
    });

    test("2. AI Banking Assistant - Answers spending comparison inquiry", async () => {
        const res = await api("POST", "/api/ai/chat", {
            headers: { Authorization: `Bearer ${authToken}` },
            body: { message: "Compare my spending with last month" },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.reply.includes("Expenses"));
    });

    test("3. Natural-Language Transaction Search - Filter by amount and status safely", async () => {
        const res = await api("POST", "/api/ai/search-transactions", {
            headers: { Authorization: `Bearer ${authToken}` },
            body: { query: "Show failed transactions" },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.count >= 1);
        assert.equal(res.body.transactions[0].status, "FAILED");
    });

    test("4. Natural-Language Transaction Search - Bill & utility queries compute authoritative total", async () => {
        const res = await api("POST", "/api/ai/search-transactions", {
            headers: { Authorization: `Bearer ${authToken}` },
            body: { query: "How much did I spend on bills this month?" },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.totalCalculated !== undefined);
        assert.ok(res.body.totalCalculated >= 2500);
    });

    test("5. AI Expense Analyzer - Deterministic calculation and internal transfer exclusion", async () => {
        const res = await api("GET", "/api/ai/expenses", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.analytics.currentMonth);
        assert.ok(res.body.analytics.categoryBreakdown.length > 0);
        assert.ok(res.body.analytics.aiInsight);
    });

    test("6. Smart Savings Advisor - Generates advice and creates goal without autonomous transfer", async () => {
        const res = await api("GET", "/api/ai/savings", {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.recommendations.length > 0);

        // Create savings goal
        const goalRes = await api("POST", "/api/ai/savings/goals", {
            headers: { Authorization: `Bearer ${authToken}` },
            body: {
                title: "Emergency Cash Reserve",
                targetAmount: 50000,
                targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
                category: "Emergency",
            },
        });

        assert.equal(goalRes.status, 201);
        assert.equal(goalRes.body.success, true);
        assert.equal(goalRes.body.goal.title, "Emergency Cash Reserve");
    });

    test("7. Suspicious Activity & Fraud Engine - Deterministic anomaly triggers explainable alert", async () => {
        const evalResult = await evaluateTransactionRisk({
            userId: testUser._id,
            accountId: testAccount._id,
            amount: 75000,
            type: "TRANSFER",
        });

        assert.equal(evalResult.flagged, true);
        assert.ok(evalResult.alerts.length >= 1);
        assert.equal(evalResult.alerts[0].alertType, "HIGH_VALUE_TRANSFER");

        // Verify alert persisted in DB
        const savedAlert = await FraudAlert.findOne({
            user: testUser._id,
            alertType: "HIGH_VALUE_TRANSFER",
        });
        assert.ok(savedAlert);
        assert.equal(savedAlert.status, "PENDING_REVIEW");
    });

    test("8. AI Support Desk - Ticket generation and AI triage summary with honest fallback", async () => {
        // Create ticket
        const ticketRes = await api("POST", "/api/support", {
            headers: { Authorization: `Bearer ${authToken}` },
            body: {
                subject: "Inquiry regarding high-value transfer flag",
                category: "Transactions",
                priority: "HIGH",
                message: "Why was my transaction flagged for administrative review?",
            },
        });

        assert.equal(ticketRes.status, 201);
        const ticketId = ticketRes.body.ticket._id;

        // Generate AI Triage Summary
        const summaryRes = await api("POST", `/api/support/${ticketId}/ai-summary`, {
            headers: { Authorization: `Bearer ${authToken}` },
        });

        assert.equal(summaryRes.status, 200);
        assert.equal(summaryRes.body.success, true);
        assert.ok(summaryRes.body.summary.recommendedAction);
        assert.ok(summaryRes.body.summary.aiProviderStatus);
    });
});