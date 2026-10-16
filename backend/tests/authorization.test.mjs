import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, api } from "./testHelper.mjs";
import User from "../src/models/User.mjs";
import Account from "../src/models/Account.mjs";
import Beneficiary from "../src/models/Beneficiary.mjs";
import Notification from "../src/models/Notification.mjs";

describe("Authorization & Cross-User Security Tests", () => {
    let userAToken = null;
    let userBToken = null;
    let userAId = null;
    let userBId = null;
    let accountAId = null;
    let beneficiaryAId = null;
    let notificationAId = null;

    before(async () => {
        await startTestServer();

        // Register and verify User A
        const userAEmail = `authsec_a_${Date.now()}@example.com`;
        const regA = await api("POST", "/api/auth/register", {
            body: {
                firstName: "User",
                lastName: "A",
                email: userAEmail,
                password: "Password123!",
                phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
            },
        });
        userAId = regA.body.user.id;
        await api("POST", "/api/auth/verify-email", {
            body: { verificationToken: regA.body.verificationToken },
        });
        const loginA = await api("POST", "/api/auth/login", {
            body: { email: userAEmail, password: "Password123!" },
        });
        userAToken = loginA.body.accessToken;

        // Register and verify User B
        const userBEmail = `authsec_b_${Date.now()}@example.com`;
        const regB = await api("POST", "/api/auth/register", {
            body: {
                firstName: "User",
                lastName: "B",
                email: userBEmail,
                password: "Password123!",
                phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
            },
        });
        userBId = regB.body.user.id;
        await api("POST", "/api/auth/verify-email", {
            body: { verificationToken: regB.body.verificationToken },
        });
        const loginB = await api("POST", "/api/auth/login", {
            body: { email: userBEmail, password: "Password123!" },
        });
        userBToken = loginB.body.accessToken;

        // Create Account for User A
        const accA = await api("POST", "/api/accounts", {
            headers: { Authorization: `Bearer ${userAToken}` },
            body: { accountType: "SAVINGS" },
        });
        accountAId = accA.body.account.id;

        // Create Beneficiary for User A
        const benA = await api("POST", "/api/beneficiaries", {
            headers: { Authorization: `Bearer ${userAToken}` },
            body: {
                name: "Beneficiary A",
                accountNumber: "SB9988776655",
                ifscCode: "SECB0000001",
            },
        });
        beneficiaryAId = benA.body.beneficiary.id;

        // Create Notification for User A
        const notif = await Notification.create({
            user: userAId,
            title: "Private Notification",
            message: "Secret account update for User A",
            type: "ACCOUNT",
        });
        notificationAId = notif._id.toString();
    });

    after(async () => {
        await User.deleteMany({ email: { $regex: /^authsec_/ } });
        await Account.deleteMany({ user: { $in: [userAId, userBId] } });
        await Beneficiary.deleteMany({ user: { $in: [userAId, userBId] } });
        await Notification.deleteMany({ user: { $in: [userAId, userBId] } });
        await stopTestServer();
    });

    test("1. Reject unauthenticated request with 401", async () => {
        const res = await api("GET", "/api/accounts");
        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
    });

    test("2. Reject invalid bearer token with 401", async () => {
        const res = await api("GET", "/api/accounts", {
            headers: { Authorization: "Bearer invalid.token.payload" },
        });
        assert.equal(res.status, 401);
    });

    test("3. Prevent User B from reading User A's account details (IDOR)", async () => {
        const res = await api("GET", `/api/accounts/${accountAId}`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.equal(res.status, 404);
        assert.equal(res.body.success, false);
    });

    test("4. Prevent User B from freezing User A's account", async () => {
        const res = await api("PATCH", `/api/accounts/${accountAId}/freeze`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.equal(res.status, 404);
    });

    test("5. Prevent User B from reading User A's transaction statement", async () => {
        const res = await api("GET", `/api/statements/${accountAId}`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.equal(res.status, 404);
    });

    test("6. Prevent User B from deleting User A's beneficiary", async () => {
        const res = await api("DELETE", `/api/beneficiaries/${beneficiaryAId}`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.equal(res.status, 404);
    });

    test("7. Prevent User B from deleting User A's notification", async () => {
        const res = await api("DELETE", `/api/notifications/${notificationAId}`, {
            headers: { Authorization: `Bearer ${userBToken}` },
        });
        assert.equal(res.status, 404);
    });

    test("8. Prevent privilege escalation via profile update", async () => {
        const res = await api("PATCH", "/api/users/profile", {
            headers: { Authorization: `Bearer ${userAToken}` },
            body: {
                firstName: "UpdatedName",
                role: "SUPER_ADMIN", // Malicious attempt to escalate role
                isActive: false,
            },
        });
        assert.equal(res.status, 400); // Disallowed unknown body fields

        // Verify role was not escalated
        const meRes = await api("GET", "/api/users/me", {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.equal(meRes.body.user.role, "CUSTOMER");
    });

    test("9. Prevent Customer from accessing Admin endpoints (403)", async () => {
        const res = await api("GET", "/api/admin/users", {
            headers: { Authorization: `Bearer ${userAToken}` },
        });
        assert.equal(res.status, 403);
    });
});
