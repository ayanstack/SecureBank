import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, api } from "./testHelper.mjs";
import User from "../src/models/User.mjs";
import Session from "../src/models/Session.mjs";

describe("Authentication & User Access Tests", () => {
    const testEmail = `authtest_${Date.now()}@example.com`;
    const testPhone = `91${Math.floor(10000000 + Math.random() * 90000000)}`;
    const testPassword = "SecurePassword123!";
    let verificationToken = null;
    let accessToken = null;
    let refreshToken = null;

    before(async () => {
        await startTestServer();
    });

    after(async () => {
        // Clean up test data
        await User.deleteMany({ email: { $regex: /^authtest_/ } });
        await stopTestServer();
    });

    test("1. POST /api/auth/register - Successfully register new user", async () => {
        const res = await api("POST", "/api/auth/register", {
            body: {
                firstName: "Auth",
                lastName: "Tester",
                email: testEmail,
                password: testPassword,
                phone: testPhone,
            },
        });

        assert.equal(res.status, 201);
        assert.equal(res.body.success, true);
        assert.ok(res.body.user);
        assert.equal(res.body.user.email, testEmail);
        assert.equal(res.body.user.role, "CUSTOMER");
        assert.equal(res.body.user.password, undefined); // Never return password hash
        assert.ok(res.body.verificationToken);

        verificationToken = res.body.verificationToken;
    });

    test("2. POST /api/auth/register - Reject duplicate email with 409", async () => {
        const res = await api("POST", "/api/auth/register", {
            body: {
                firstName: "Duplicate",
                lastName: "User",
                email: testEmail,
                password: testPassword,
                phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
            },
        });

        assert.equal(res.status, 409);
        assert.equal(res.body.success, false);
    });

    test("3. POST /api/auth/register - Reject short password (< 8 chars) with 400", async () => {
        const res = await api("POST", "/api/auth/register", {
            body: {
                firstName: "Weak",
                lastName: "Pass",
                email: `weak_${Date.now()}@example.com`,
                password: "short",
                phone: `91${Math.floor(10000000 + Math.random() * 90000000)}`,
            },
        });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
    });

    test("4. POST /api/auth/login - Reject unverified user with 403", async () => {
        const res = await api("POST", "/api/auth/login", {
            body: {
                email: testEmail,
                password: testPassword,
            },
        });

        assert.equal(res.status, 403);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /verify your email/i);
    });

    test("5. POST /api/auth/verify-email - Verify email with token", async () => {
        const res = await api("POST", "/api/auth/verify-email", {
            body: {
                verificationToken,
            },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
    });

    test("6. POST /api/auth/login - Successfully login with verified credentials", async () => {
        const res = await api("POST", "/api/auth/login", {
            body: {
                email: testEmail,
                password: testPassword,
            },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.accessToken);
        assert.ok(res.body.refreshToken);
        assert.equal(res.body.user.email, testEmail);

        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    test("7. POST /api/auth/login - Reject invalid password with 401", async () => {
        const res = await api("POST", "/api/auth/login", {
            body: {
                email: testEmail,
                password: "WrongPassword999!",
            },
        });

        assert.equal(res.status, 401);
        assert.equal(res.body.success, false);
    });

    test("8. POST /api/auth/refresh - Refresh access token and rotate refresh token", async () => {
        const res = await api("POST", "/api/auth/refresh", {
            body: {
                refreshToken,
            },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.accessToken);
        assert.ok(res.body.refreshToken);
        assert.notEqual(res.body.refreshToken, refreshToken); // Token rotation!

        // Update tokens
        accessToken = res.body.accessToken;
        refreshToken = res.body.refreshToken;
    });

    test("9. PUT /api/auth/change-password - Change password and invalidate sessions", async () => {
        const newPassword = "BrandNewPassword456!";
        const res = await api("PUT", "/api/auth/change-password", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: {
                currentPassword: testPassword,
                newPassword,
            },
        });

        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);

        // Previous token session should now be revoked
        const oldTokenCheck = await api("GET", "/api/users/me", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        assert.equal(oldTokenCheck.status, 401);

        // Login with new password
        const loginRes = await api("POST", "/api/auth/login", {
            body: {
                email: testEmail,
                password: newPassword,
            },
        });
        assert.equal(loginRes.status, 200);
        accessToken = loginRes.body.accessToken;
        refreshToken = loginRes.body.refreshToken;
    });

    test("10. POST /api/auth/forgot-password & reset-password flow", async () => {
        const forgotRes = await api("POST", "/api/auth/forgot-password", {
            body: {
                email: testEmail,
            },
        });

        assert.equal(forgotRes.status, 200);
        assert.ok(forgotRes.body.resetToken);

        const resetRes = await api("POST", "/api/auth/reset-password", {
            body: {
                resetToken: forgotRes.body.resetToken,
                newPassword: "ResetPassword789!",
            },
        });

        assert.equal(resetRes.status, 200);
        assert.equal(resetRes.body.success, true);

        // Re-login with reset password
        const loginRes = await api("POST", "/api/auth/login", {
            body: {
                email: testEmail,
                password: "ResetPassword789!",
            },
        });
        assert.equal(loginRes.status, 200);
        accessToken = loginRes.body.accessToken;
    });

    test("11. Transaction PIN management & verification", async () => {
        // Set PIN
        const setPinRes = await api("POST", "/api/users/transaction-pin", {
            headers: { Authorization: `Bearer ${accessToken}` },
            body: { pin: "1234" },
        });
        assert.equal(setPinRes.status, 200);

        // Verify correct PIN
        const verifyOk = await api("POST", "/api/users/verify-transaction-pin", {
            headers: { Authorization: `Bearer ${accessToken}` },
            body: { pin: "1234" },
        });
        assert.equal(verifyOk.status, 200);

        // Verify wrong PIN gives 401 with remaining attempts
        const verifyWrong = await api("POST", "/api/users/verify-transaction-pin", {
            headers: { Authorization: `Bearer ${accessToken}` },
            body: { pin: "9999" },
        });
        assert.equal(verifyWrong.status, 401);
        assert.equal(verifyWrong.body.attemptsRemaining, 2);

        // Change PIN
        const changePin = await api("PUT", "/api/users/transaction-pin", {
            headers: { Authorization: `Bearer ${accessToken}` },
            body: { currentPin: "1234", newPin: "4321" },
        });
        assert.equal(changePin.status, 200);

        // Verify new PIN
        const verifyNew = await api("POST", "/api/users/verify-transaction-pin", {
            headers: { Authorization: `Bearer ${accessToken}` },
            body: { pin: "4321" },
        });
        assert.equal(verifyNew.status, 200);
    });
});
