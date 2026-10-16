import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, api } from "./testHelper.mjs";
import User from "../src/models/User.mjs";
import Account from "../src/models/Account.mjs";
import Beneficiary from "../src/models/Beneficiary.mjs";
import Transfer from "../src/models/Transfer.mjs";
import Transaction from "../src/models/Transaction.mjs";

describe("Banking, Money Transfers & Statements Tests", () => {
    let senderToken = null;
    let receiverToken = null;
    let senderId = null;
    let receiverId = null;
    let senderAccountId = null;
    let receiverAccountId = null;
    let receiverAccountNumber = null;
    let beneficiaryId = null;

    before(async () => {
        await startTestServer();

        // 1. Create Sender
        const senderEmail = `bank_sender_${Date.now()}@example.com`;
        const regSender = await api("POST", "/api/auth/register", {
            body: {
                firstName: "Sender",
                lastName: "Account",
                email: senderEmail,
                password: "Password123!",
                phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
            },
        });
        senderId = regSender.body.user.id;
        await api("POST", "/api/auth/verify-email", {
            body: { verificationToken: regSender.body.verificationToken },
        });
        const loginSender = await api("POST", "/api/auth/login", {
            body: { email: senderEmail, password: "Password123!" },
        });
        senderToken = loginSender.body.accessToken;

        // Set sender PIN
        await api("POST", "/api/users/transaction-pin", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: { pin: "1122" },
        });

        // Create sender account
        const accSender = await api("POST", "/api/accounts", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: { accountType: "SAVINGS" },
        });
        senderAccountId = accSender.body.account.id;

        // 2. Create Receiver
        const receiverEmail = `bank_receiver_${Date.now()}@example.com`;
        const regReceiver = await api("POST", "/api/auth/register", {
            body: {
                firstName: "Receiver",
                lastName: "Account",
                email: receiverEmail,
                password: "Password123!",
                phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
            },
        });
        receiverId = regReceiver.body.user.id;
        await api("POST", "/api/auth/verify-email", {
            body: { verificationToken: regReceiver.body.verificationToken },
        });
        const loginReceiver = await api("POST", "/api/auth/login", {
            body: { email: receiverEmail, password: "Password123!" },
        });
        receiverToken = loginReceiver.body.accessToken;

        // Create receiver account
        const accReceiver = await api("POST", "/api/accounts", {
            headers: { Authorization: `Bearer ${receiverToken}` },
            body: { accountType: "SAVINGS" },
        });
        receiverAccountId = accReceiver.body.account.id;
        receiverAccountNumber = accReceiver.body.account.accountNumber;

        // 3. Add receiver as beneficiary for sender
        const benRes = await api("POST", "/api/beneficiaries", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: {
                name: "Receiver Partner",
                accountNumber: receiverAccountNumber,
                ifscCode: "SECB0000001",
            },
        });
        beneficiaryId = benRes.body.beneficiary.id;
    });

    after(async () => {
        await User.deleteMany({ email: { $regex: /^bank_/ } });
        await Account.deleteMany({ user: { $in: [senderId, receiverId] } });
        await Beneficiary.deleteMany({ user: { $in: [senderId, receiverId] } });
        await Transfer.deleteMany({ senderAccount: senderAccountId });
        await Transaction.deleteMany({ user: { $in: [senderId, receiverId] } });
        await stopTestServer();
    });

    test("1. POST /api/transactions/deposit - Deposit money into sender account", async () => {
        const res = await api("POST", "/api/transactions/deposit", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: {
                accountId: senderAccountId,
                amount: 5000,
                description: "Initial payroll deposit",
            },
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.equal(res.body.transaction.amount, 5000);
        assert.equal(res.body.transaction.balanceAfter, 5000);

        // Verify balance on account endpoint
        const accRes = await api("GET", `/api/accounts/${senderAccountId}`, {
            headers: { Authorization: `Bearer ${senderToken}` },
        });
        assert.equal(accRes.body.account.balance, 5000);
    });

    test("2. POST /api/transactions/withdraw - Withdraw money with balance check", async () => {
        const res = await api("POST", "/api/transactions/withdraw", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: {
                accountId: senderAccountId,
                amount: 1000,
                description: "ATM Cash Withdrawal",
            },
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.transaction.balanceAfter, 4000);

        // Verify balance
        const accRes = await api("GET", `/api/accounts/${senderAccountId}`, {
            headers: { Authorization: `Bearer ${senderToken}` },
        });
        assert.equal(accRes.body.account.balance, 4000);
    });

    test("3. POST /api/transactions/withdraw - Prevent overdraft with insufficient funds", async () => {
        const res = await api("POST", "/api/transactions/withdraw", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: {
                accountId: senderAccountId,
                amount: 999999, // Way more than 4000
                description: "Overdraft attempt",
            },
        });

        assert.equal(res.status, 400);
        assert.match(res.body.message, /insufficient balance/i);
    });

    test("4. POST /api/transfers - Successfully transfer money to beneficiary", async () => {
        const res = await api("POST", "/api/transfers", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: {
                senderAccountId,
                beneficiaryId,
                amount: 1500,
                transactionPin: "1122",
                description: "Payment for consulting",
            },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.transfer.amount, 1500);

        // Verify sender balance (4000 - 1500 = 2500)
        const senderAcc = await api("GET", `/api/accounts/${senderAccountId}`, {
            headers: { Authorization: `Bearer ${senderToken}` },
        });
        assert.equal(senderAcc.body.account.balance, 2500);

        // Verify receiver balance (0 + 1500 = 1500)
        const receiverAcc = await api("GET", `/api/accounts/${receiverAccountId}`, {
            headers: { Authorization: `Bearer ${receiverToken}` },
        });
        assert.equal(receiverAcc.body.account.balance, 1500);
    });

    test("5. POST /api/transfers - Idempotency Key prevents duplicate transfer debit", async () => {
        const idempotencyKey = `tx_key_${Date.now()}`;

        // First attempt with idempotency key
        const firstAttempt = await api("POST", "/api/transfers", {
            headers: {
                Authorization: `Bearer ${senderToken}`,
                "Idempotency-Key": idempotencyKey,
            },
            body: {
                senderAccountId,
                beneficiaryId,
                amount: 500,
                transactionPin: "1122",
                description: "Rent installment",
            },
        });
        assert.equal(firstAttempt.status, 200);
        const originalTransferId = firstAttempt.body.transfer.id;

        // Second duplicate attempt with exact same idempotency key
        const secondAttempt = await api("POST", "/api/transfers", {
            headers: {
                Authorization: `Bearer ${senderToken}`,
                "Idempotency-Key": idempotencyKey,
            },
            body: {
                senderAccountId,
                beneficiaryId,
                amount: 500,
                transactionPin: "1122",
                description: "Rent installment",
            },
        });

        assert.equal(secondAttempt.status, 200);
        assert.equal(secondAttempt.body.transfer.id, originalTransferId);
        assert.equal(secondAttempt.body.transfer.isIdempotentReplay, true);

        // Verify sender was debited ONLY once (2500 - 500 = 2000)
        const senderAcc = await api("GET", `/api/accounts/${senderAccountId}`, {
            headers: { Authorization: `Bearer ${senderToken}` },
        });
        assert.equal(senderAcc.body.account.balance, 2000);
    });

    test("6. POST /api/transfers - Reject wrong PIN with 401", async () => {
        const res = await api("POST", "/api/transfers", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: {
                senderAccountId,
                beneficiaryId,
                amount: 100,
                transactionPin: "0000", // Wrong PIN
            },
        });

        assert.equal(res.status, 401);
        assert.match(res.body.message, /invalid transaction pin/i);
    });

    test("7. GET /api/statements/:accountId/summary - Accurate credit/debit totals", async () => {
        const res = await api("GET", `/api/statements/${senderAccountId}/summary`, {
            headers: { Authorization: `Bearer ${senderToken}` },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.summary.closingBalance, 2000);
        assert.ok(res.body.summary.totalCredits >= 5000);
        assert.ok(res.body.summary.totalDebits >= 3000);
    });

    test("8. GET /api/statements/:accountId/download/csv - Safe CSV and formula injection protection", async () => {
        // First deposit with a formula string like "=SUM(1,2)" in description to test formula injection protection
        await api("POST", "/api/transactions/deposit", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: {
                accountId: senderAccountId,
                amount: 10,
                description: "=1+2 formula exploit",
            },
        });

        const res = await api("GET", `/api/statements/${senderAccountId}/download/csv`, {
            headers: { Authorization: `Bearer ${senderToken}` },
        });

        assert.equal(res.status, 200);
        assert.match(res.headers.get("content-type"), /text\/csv/);
        // Formula injection protection: check that the formula was prepended with a single quote
        assert.match(res.body, /'=1\+2 formula exploit/);
    });

    test("9. PATCH /api/transfers/:id/reverse - Successfully reverse transfer with CR/DR refund", async () => {
        // Create a 200 transfer to reverse
        const txRes = await api("POST", "/api/transfers", {
            headers: { Authorization: `Bearer ${senderToken}` },
            body: {
                senderAccountId,
                beneficiaryId,
                amount: 200,
                transactionPin: "1122",
                description: "Erroneous transfer to reverse",
            },
        });
        const transferId = txRes.body.transfer.id;

        // Sender balance was: 2010 - 200 = 1810
        // Receiver balance was: 2000 + 200 = 2200

        // Reverse transfer
        const revRes = await api("PATCH", `/api/transfers/${transferId}/reverse`, {
            headers: { Authorization: `Bearer ${senderToken}` },
        });

        assert.equal(revRes.status, 200);
        assert.equal(revRes.body.success, true);
        assert.equal(revRes.body.transfer.status, "REVERSED");

        // Verify sender refunded: 1810 + 200 = 2010
        const senderAcc = await api("GET", `/api/accounts/${senderAccountId}`, {
            headers: { Authorization: `Bearer ${senderToken}` },
        });
        assert.equal(senderAcc.body.account.balance, 2010);

        // Verify receiver deducted: 2200 - 200 = 2000
        const receiverAcc = await api("GET", `/api/accounts/${receiverAccountId}`, {
            headers: { Authorization: `Bearer ${receiverToken}` },
        });
        assert.equal(receiverAcc.body.account.balance, 2000);
    });
});
