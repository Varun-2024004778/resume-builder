const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
process.env.FRONTEND_URL = "http://127.0.0.1:5500";
process.env.RESEND_API_KEY = "test-key";
process.env.TRUST_PROXY ??= "1";

const app = require("../server");
const { sql } = require("../config/db");

let server;
let base;
const password = "correct-horse-battery";
const email = `supabase-migration-${crypto.randomUUID()}@example.com`;

async function call(method, path, { body, token } = {}) {
    const response = await fetch(base + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    let json = null;
    try {
        json = await response.json();
    } catch {}
    return { status: response.status, json };
}

test.before(async () => {
    if (!sql) throw new Error("DATABASE_URL is not configured");
    await new Promise((resolve) => {
        server = app.listen(0, "127.0.0.1", resolve);
    });
    base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
    await sql`delete from public.users where email = ${email}`;
    await sql.end({ timeout: 5 });
    if (server) await new Promise((resolve) => server.close(resolve));
});

test("Supabase: register, login, and resume ownership", async () => {
    const registered = await call("POST", "/api/register", {
        body: { name: "Migration Test", email, password }
    });
    assert.equal(registered.status, 201);

    const login = await call("POST", "/api/login", {
        body: { email, password }
    });
    assert.equal(login.status, 200);
    assert.equal(typeof login.json.token, "string");

    const contact = {
        firstname: "Ada",
        lastname: "Lovelace",
        phone: "123456",
        email: "ada@example.com",
        address: "1 Main St",
        city: "London",
        state: "LDN",
        country: "UK",
        postalcode: "N1"
    };
    assert.equal((await call("POST", "/api/resume/contact", {
        token: login.json.token,
        body: contact
    })).status, 200);

    assert.equal((await call("POST", "/api/resume/skills", {
        token: login.json.token,
        body: { skills: ["PostgreSQL", "SQL"] }
    })).status, 200);

    const resume = await call("GET", "/api/resume", { token: login.json.token });
    assert.equal(resume.status, 200);
    assert.equal(resume.json.resume.contact.firstname, "Ada");
    assert.deepEqual(resume.json.resume.skills, ["PostgreSQL", "SQL"]);
    assert.equal(resume.json.resume.userId, jwtId(login.json.token));
});

test("Supabase: tampered and anonymous resume requests are rejected", async () => {
    assert.equal((await call("GET", "/api/resume")).status, 401);
    assert.equal((await call("GET", "/api/resume", {
        token: "tampered-token"
    })).status, 401);
});

function jwtId(token) {
    const payload = token.split(".")[1];
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).id;
}
