import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { startTestServer, stopTestServer, api } from "./testHelper.mjs";

describe("Application Security & Resiliency Tests", () => {
    before(async () => {
        await startTestServer();
    });

    after(async () => {
        await stopTestServer();
    });

    test("1. GET /api/health - Returns API health and version", async () => {
        const res = await api("GET", "/api/health");
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.timestamp);
    });

    test("2. Non-existent route returns clean 404 JSON", async () => {
        const res = await api("GET", "/api/nonexistent-endpoint-xyz");
        assert.equal(res.status, 404);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /not found/i);
    });

    test("3. Reject Malformed JSON in request body with 400", async () => {
        const res = await api("POST", "/api/auth/login", {
            body: "{ broken json: 123 ",
            headers: { "Content-Type": "application/json" },
        });

        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /malformed json/i);
    });

    test("4. NoSQL operator injection in query parameter is blocked with 400", async () => {
        // Attempt query injection like /api/health?param[$gt]=0
        const res = await api("GET", "/api/health?role[$ne]=CUSTOMER");
        assert.equal(res.status, 400);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /prohibited operators/i);
    });

    test("5. Invalid ObjectId format in route parameter returns 400", async () => {
        const res = await api("GET", "/api/accounts/not-a-valid-object-id");
        // Should either be rejected by validator or auth
        assert.ok(res.status === 400 || res.status === 401);
    });

    test("6. Verify Cache-Control: no-store headers on sensitive routes", async () => {
        const res = await api("GET", "/api/accounts");
        const cacheControl = res.headers.get("cache-control") || "";
        assert.match(cacheControl, /no-store/i);
        assert.match(cacheControl, /no-cache/i);
    });
});
