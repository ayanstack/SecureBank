import "dotenv/config";
import http from "http";
import app from "../src/app.mjs";
import connectDB, { disconnectDB } from "../src/config/db.mjs";

let server = null;
let baseUrl = null;

export const startTestServer = async () => {
    if (!server) {
        await connectDB();
        server = http.createServer(app);
        await new Promise((resolve) => server.listen(0, resolve));
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
    }
    return { server, baseUrl };
};

export const stopTestServer = async () => {
    if (server) {
        await new Promise((resolve) => server.close(resolve));
        server = null;
    }
    await disconnectDB();
};

export const api = async (method, path, options = {}) => {
    if (!baseUrl) {
        await startTestServer();
    }

    const url = `${baseUrl}${path}`;
    const headers = { ...options.headers };

    if (!headers["Content-Type"] && !headers["content-type"] && method !== "GET" && method !== "DELETE") {
        headers["Content-Type"] = "application/json";
    }

    const fetchOptions = {
        method,
        headers,
    };

    if (options.body !== undefined) {
        fetchOptions.body =
            typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    return {
        status: response.status,
        headers: response.headers,
        body: data,
    };
};
