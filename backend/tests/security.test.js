/**
 * Integration tests for the security fixes.
 * Needs a throwaway MongoDB:  TEST_MONGO_URI=mongodb://127.0.0.1:27017/dreamcv_test npm test
 * (the database is DROPPED at the start of the run - never point it at real data).
 * Password-reset emails are intercepted in-process; nothing is sent.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
process.env.MONGO_URI = process.env.TEST_MONGO_URI || "mongodb://127.0.0.1:27017/dreamcv_test";
process.env.FRONTEND_URL = "http://127.0.0.1:5500";
process.env.RESEND_API_KEY = "test-key";
process.env.TRUST_PROXY ??= "1";

// ---- intercept Resend, pass everything else through --------------------------
const realFetch = global.fetch;
const sentEmails = [];
let resendMode = "ok";
global.fetch = async (url, opts) => {
    if (String(url).startsWith("https://api.resend.com")) {
        sentEmails.push(JSON.parse(opts.body));
        return resendMode === "fail"
            ? new Response("provider exploded", { status: 500 })
            : new Response("{}", { status: 200 });
    }
    return realFetch(url, opts);
};

const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const Resume = require("../models/Resume");
const { validateEnv } = require("../config/env");

let server, base, ipCounter = 0;
const nextIp = () => `10.${(ipCounter >> 16) & 255}.${(ipCounter >> 8) & 255}.${++ipCounter & 255}`;
const uniqueEmail = () => `u-${crypto.randomUUID()}@example.com`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PASSWORD = "correct-horse-battery";

async function call(method, path, { body, token, ip = nextIp(), headers = {} } = {}) {
    const res = await realFetch(base + path, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-Forwarded-For": ip,
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers
        },
        body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body))
    });
    let json = null;
    try { json = await res.clone().json(); } catch {}
    return { status: res.status, json, headers: res.headers };
}

async function makeUser() {
    const email = uniqueEmail();
    assert.equal((await call("POST", "/api/register", { body: { name: "Test", email, password: PASSWORD } })).status, 201);
    const login = await call("POST", "/api/login", { body: { email, password: PASSWORD } });
    assert.equal(login.status, 200);
    return { email, token: login.json.token };
}

const contact = {
    firstname: "Ada", lastname: "Lovelace", phone: "123456", email: "ada@example.com",
    address: "1 Main St", city: "London", state: "LDN", country: "UK", postalcode: "N1"
};

async function waitFor(fn, ms = 2000) {
    const end = Date.now() + ms;
    while (Date.now() < end) { const v = await fn(); if (v) return v; await sleep(25); }
    return null;
}

test.before(async () => {
    await mongoose.connection.asPromise();
    await mongoose.connection.dropDatabase();
    await User.init(); await Resume.init();
    await new Promise((r) => { server = app.listen(0, "127.0.0.1", r); });
    base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => { server.close(); await mongoose.disconnect(); });

// ============================ configuration ============================
test("startup refuses weak or placeholder JWT_SECRET", () => {
    const saved = process.env.JWT_SECRET;
    try {
        process.env.JWT_SECRET = "replace-with-a-long-random-secret";
        assert.throws(validateEnv, /JWT_SECRET/);
        process.env.JWT_SECRET = "short";
        assert.throws(validateEnv, /at least 32/);
        process.env.JWT_SECRET = saved;
        assert.doesNotThrow(validateEnv);
    } finally { process.env.JWT_SECRET = saved; }
});

test("production requires an https FRONTEND_URL", () => {
    const [env, url] = [process.env.NODE_ENV, process.env.FRONTEND_URL];
    try {
        process.env.NODE_ENV = "production"; process.env.FRONTEND_URL = "http://example.com";
        assert.throws(validateEnv, /https/);
    } finally { process.env.NODE_ENV = env; process.env.FRONTEND_URL = url; }
});

// ============================ auth basics ============================
test("password policy: min 10 chars, max 72 bytes, strings only", async () => {
    const email = uniqueEmail();
    for (const password of ["short", "123456789", "x".repeat(73), ["a","b","c","d","e","f","g","h","i","j"], { a: 1 }]) {
        const r = await call("POST", "/api/register", { body: { name: "T", email, password } });
        assert.equal(r.status, 400, `accepted ${JSON.stringify(password)}`);
    }
});

test("register/login happy path and duplicate email", async () => {
    const { email } = await makeUser();
    const dup = await call("POST", "/api/register", { body: { name: "T", email: email.toUpperCase(), password: PASSWORD } });
    assert.equal(dup.status, 400);
});

test("login failure message is identical for wrong password and unknown email", async () => {
    const { email } = await makeUser();
    const wrong = await call("POST", "/api/login", { body: { email, password: "nope-nope-nope" } });
    const unknown = await call("POST", "/api/login", { body: { email: uniqueEmail(), password: "nope-nope-nope" } });
    assert.equal(wrong.status, 400);
    assert.deepEqual(wrong.json, unknown.json);
});

test("login does the same bcrypt work for unknown emails (no timing oracle)", async () => {
    const { email } = await makeUser();
    const time = async (e) => { const t = process.hrtime.bigint(); await call("POST", "/api/login", { body: { email: e, password: "wrong-wrong-wrong" } }); return Number(process.hrtime.bigint() - t) / 1e6; };
    const known = [], unknown = [];
    for (let i = 0; i < 4; i++) { known.push(await time(email)); unknown.push(await time(uniqueEmail())); }
    const med = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
    assert.ok(med(unknown) > med(known) * 0.5, `unknown ${med(unknown)}ms vs known ${med(known)}ms`);
});

test("NoSQL operator payloads are rejected, and sanitizeFilter neutralises them in the ORM", async () => {
    for (const body of [{ email: { $ne: null }, password: { $ne: null } }, { email: { $gt: "" }, password: PASSWORD }]) {
        assert.equal((await call("POST", "/api/login", { body })).status, 400);
    }
    assert.equal((await call("POST", "/api/forgot-password", { body: { email: { $ne: null } } })).status, 400);
    assert.equal((await call("POST", "/api/reset-password", { body: { token: { $ne: null }, password: PASSWORD } })).status, 400);
    await makeUser();
    // Without sanitizeFilter this returns the first user in the DB. With it, the operator is
    // wrapped in $eq and the query is refused (CastError) or matches nothing - never a user.
    const leaked = await User.findOne({ email: { $ne: null } }).catch((e) => (e.name === "CastError" ? null : Promise.reject(e)));
    assert.equal(leaked, null);
});

test("tokens: tampered, wrong-secret, alg=none, and deleted-user tokens are rejected", async () => {
    const { token } = await makeUser();
    const id = jwt.decode(token).id;
    const forged = jwt.sign({ id }, "some-other-secret-some-other-secret", { expiresIn: "1d" });
    const none = [Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url"), Buffer.from(JSON.stringify({ id })).toString("base64url"), ""].join(".");
    const ghost = jwt.sign({ id: String(new mongoose.Types.ObjectId()), tv: 0 }, process.env.JWT_SECRET, { expiresIn: "1d" });
    for (const t of [token + "x", forged, none, ghost, "garbage"]) {
        assert.equal((await call("GET", "/api/resume", { token: t })).status, 401);
    }
    await User.deleteOne({ _id: id });
    assert.equal((await call("GET", "/api/resume", { token })).status, 401); // deleted user's token dies immediately
});

// ============================ password reset ============================
test("forgot-password: identical response for known/unknown emails, even when the email provider fails", async () => {
    const { email } = await makeUser();
    const known = await call("POST", "/api/forgot-password", { body: { email } });
    const unknown = await call("POST", "/api/forgot-password", { body: { email: uniqueEmail() } });
    assert.equal(known.status, 200);
    assert.deepEqual(known, { ...unknown, headers: known.headers }); // same status + same body

    // provider outage for a REAL account must not change the response
    resendMode = "fail";
    const { email: email2 } = await makeUser();
    const failing = await call("POST", "/api/forgot-password", { body: { email: email2 } });
    assert.equal(failing.status, 200);
    assert.deepEqual(failing.json, unknown.json);
    // ...and the cooldown is released so the user can retry immediately
    assert.ok(await waitFor(async () => (await User.findOne({ email: email2 })).resetPasswordToken === null));
    resendMode = "ok";
    const before = sentEmails.length;
    await call("POST", "/api/forgot-password", { body: { email: email2 } });
    assert.ok(await waitFor(() => sentEmails.length > before));
});

test("forgot-password: per-account cooldown sends at most one email per minute", async () => {
    const { email } = await makeUser();
    const count = () => sentEmails.filter((m) => m.to[0] === email).length;
    await call("POST", "/api/forgot-password", { body: { email } });
    assert.ok(await waitFor(() => count() === 1));
    for (let i = 0; i < 3; i++) await call("POST", "/api/forgot-password", { body: { email } });
    await sleep(150);
    assert.equal(count(), 1);
});

test("reset: single-use, atomic, expires, and revokes existing sessions", async () => {
    const { email, token: oldJwt } = await makeUser();
    assert.equal((await call("GET", "/api/resume", { token: oldJwt })).status, 404); // valid session (no resume yet)

    await call("POST", "/api/forgot-password", { body: { email } });
    const mail = await waitFor(() => sentEmails.filter((m) => m.to[0] === email).pop());
    const resetToken = /token=([0-9a-f]+)/.exec(mail.text)[1];

    // the DB stores only a hash of the token
    const stored = await User.findOne({ email });
    assert.notEqual(stored.resetPasswordToken, resetToken);

    // two simultaneous attempts with the same token: exactly one wins
    const [a, b] = await Promise.all([
        call("POST", "/api/reset-password", { body: { token: resetToken, password: "first-new-password" } }),
        call("POST", "/api/reset-password", { body: { token: resetToken, password: "second-new-password" } })
    ]);
    assert.deepEqual([a.status, b.status].sort(), [200, 400]);
    assert.equal((await call("POST", "/api/reset-password", { body: { token: resetToken, password: "third-new-password" } })).status, 400);

    // old session is dead, old password is dead, new password works
    assert.equal((await call("GET", "/api/resume", { token: oldJwt })).status, 401);
    assert.equal((await call("POST", "/api/login", { body: { email, password: PASSWORD } })).status, 400);
    const winner = a.status === 200 ? "first-new-password" : "second-new-password";
    const fresh = await call("POST", "/api/login", { body: { email, password: winner } });
    assert.equal(fresh.status, 200);
    assert.equal((await call("GET", "/api/resume", { token: fresh.json.token })).status, 404);

});

test("reset: expired and weak-password requests are refused", async () => {
    const { email } = await makeUser();
    await call("POST", "/api/forgot-password", { body: { email } });
    const mail = await waitFor(() => sentEmails.filter((m) => m.to[0] === email).pop());
    const t = /token=([0-9a-f]+)/.exec(mail.text)[1];
    assert.equal((await call("POST", "/api/reset-password", { body: { token: t, password: "short" } })).status, 400);
    await User.updateOne({ email }, { $set: { resetPasswordExpires: new Date(Date.now() - 1000) } });
    assert.equal((await call("POST", "/api/reset-password", { body: { token: t, password: "long-enough-password" } })).status, 400);
});

// ============================ resume API ============================
test("resume: full flow, ownership scoping, no cross-user access", async () => {
    const A = await makeUser(), B = await makeUser();
    assert.equal((await call("POST", "/api/resume/contact", { token: A.token, body: { ...contact, userId: String(new mongoose.Types.ObjectId()), isAdmin: true } })).status, 200);
    assert.equal((await call("POST", "/api/resume/education", { token: A.token, body: { institution: "MIT", location: "Cambridge", degree: "BSc", graduationDate: "2024-05-01", enrolled: false } })).status, 200);
    assert.equal((await call("POST", "/api/resume/experience", { token: A.token, body: { experience: [{ company: "ACME", role: "Dev", startDate: "2022-01", current: true, description: "x" }] } })).status, 200);
    assert.equal((await call("POST", "/api/resume/skills", { token: A.token, body: { skills: ["JS", "js", " Node ", ""] } })).status, 200);
    assert.equal((await call("POST", "/api/resume/projects", { token: A.token, body: { projects: [{ title: "P", description: "d", stack: "js", github: "https://github.com/a/b" }] } })).status, 200);
    assert.equal((await call("POST", "/api/resume/certifications", { token: A.token, body: { certifications: [{ name: "AWS", issuer: "Amazon", issueDate: "2024-01", url: "" }] } })).status, 200);
    assert.equal((await call("POST", "/api/resume/summary", { token: A.token, body: { summary: "Hello" } })).status, 200);

    const got = await call("GET", "/api/resume", { token: A.token });
    assert.equal(got.json.resume.isCompleted, true);
    assert.deepEqual(got.json.resume.skills, ["JS", "Node"]);              // trimmed + de-duplicated
    assert.equal(got.json.resume.userId, jwt.decode(A.token).id);          // body-supplied userId ignored
    assert.equal(got.json.resume.isAdmin, undefined);

    assert.equal((await call("GET", "/api/resume", { token: B.token })).status, 404); // B cannot see A's CV
});

test("resume: first-save race creates exactly one document", async () => {
    const { token } = await makeUser();
    const rs = await Promise.all(Array.from({ length: 8 }, () => call("POST", "/api/resume/contact", { token, body: contact })));
    assert.ok(rs.every((r) => r.status === 200), JSON.stringify(rs.map((r) => r.status)));
    assert.equal(await Resume.countDocuments({ userId: jwt.decode(token).id }), 1);
});

test("resume: input validation rejects hostile or oversized data and strips unknown fields", async () => {
    const { token } = await makeUser();
    await call("POST", "/api/resume/contact", { token, body: contact });
    const post = (p, body) => call("POST", `/api/resume/${p}`, { token, body });
    const proj = (o) => ({ projects: [{ title: "P", description: "d", stack: "s", ...o }] });

    assert.equal((await post("projects", proj({ github: "javascript:alert(1)" }))).status, 400);
    assert.equal((await post("projects", proj({ github: "data:text/html,<script>1</script>" }))).status, 400);
    assert.equal((await post("projects", proj({ description: "x".repeat(2001) }))).status, 400);
    assert.equal((await post("projects", proj({ title: { $ne: 1 } }))).status, 400);
    assert.equal((await post("projects", { projects: Array(21).fill(proj({}).projects[0]) })).status, 400);
    assert.equal((await post("projects", { projects: ["not-an-object"] })).status, 400);
    assert.equal((await post("experience", { experience: [{ company: "A", role: "B", startDate: "not-a-date" }] })).status, 400);
    assert.equal((await post("skills", { skills: [{ a: 1 }] })).status, 400);
    assert.equal((await post("summary", { summary: "x".repeat(5001) })).status, 400);
    assert.equal((await post("contact", { ...contact, email: "not-an-email" })).status, 400);

    // unknown / dangerous keys are not persisted
    const ok = await post("projects", proj({ github: "https://github.com/a/b", __proto__: { admin: true }, $where: "1", extra: "x" }));
    assert.equal(ok.status, 200);
    const stored = (await Resume.findOne({ userId: jwt.decode(token).id }).lean()).projects[0];
    assert.deepEqual(Object.keys(stored).sort(), ["description", "github", "stack", "title"]);
});

// ============================ rate limiting ============================
test("rate limits: per-IP counted correctly behind a proxy; one account cannot be brute-forced from many IPs", async () => {
    // (1) 25 failed logins from 25 DIFFERENT clients (different accounts) must not lock out a 26th client.
    //     Before the fix every client shared one bucket of 20 requests per 15 minutes.
    for (let i = 0; i < 25; i++) {
        const r = await call("POST", "/api/login", { body: { email: uniqueEmail(), password: "nope-nope-nope" } });
        assert.equal(r.status, 400);
    }
    const { email } = await makeUser();
    const fine = await call("POST", "/api/login", { body: { email, password: PASSWORD } });
    assert.equal(fine.status, 200, "a new client was throttled by other clients' traffic");

    // (2) 10 failed guesses at ONE account from 10 different IPs -> the account is locked for further guesses
    const target = (await makeUser()).email;
    for (let i = 0; i < 10; i++) {
        assert.equal((await call("POST", "/api/login", { body: { email: target, password: "nope-nope-nope" } })).status, 400);
    }
    assert.equal((await call("POST", "/api/login", { body: { email: target, password: "nope-nope-nope" } })).status, 429);
    assert.equal((await call("POST", "/api/login", { body: { email: target, password: PASSWORD } })).status, 429);

    // (3) a single IP is limited too (20 failed attempts across accounts)
    const ip = nextIp();
    for (let i = 0; i < 20; i++) await call("POST", "/api/login", { ip, body: { email: uniqueEmail(), password: "nope-nope-nope" } });
    assert.equal((await call("POST", "/api/login", { ip, body: { email: uniqueEmail(), password: "nope-nope-nope" } })).status, 429);

    // (4) successful logins do not eat the budget
    const ok = await makeUser();
    const ip2 = nextIp();
    for (let i = 0; i < 25; i++) assert.equal((await call("POST", "/api/login", { ip: ip2, body: { email: ok.email, password: PASSWORD } })).status, 200);
});

// ============================ HTTP hardening ============================
test("security headers present; X-Powered-By removed", async () => {
    const r = await call("GET", "/");
    assert.equal(r.headers.get("x-powered-by"), null);
    assert.ok(r.headers.get("x-content-type-options"));
    assert.ok(r.headers.get("strict-transport-security"));
});

test("errors never leak stack traces", async () => {
    const bad = await realFetch(base + "/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{not json" });
    const text = await bad.text();
    assert.equal(bad.status, 400);
    assert.doesNotMatch(text, /at .*\(.*:\d+:\d+\)|node_modules/);
    const big = await call("POST", "/api/login", { body: { email: "a@b.co", password: "x".repeat(200_000) } });
    assert.equal(big.status, 413);
    assert.equal((await call("GET", "/nope")).status, 404);
});

test("CORS: only the configured frontend origin gets CORS headers; localhost dev origin is dev-only", async () => {
    const ok = await call("GET", "/", { headers: { Origin: "http://127.0.0.1:5500" } });
    assert.equal(ok.headers.get("access-control-allow-origin"), "http://127.0.0.1:5500");
    const evil = await call("GET", "/", { headers: { Origin: "https://evil.example" } });
    assert.equal(evil.status, 200);                         // no 500 / stack trace
    assert.equal(evil.headers.get("access-control-allow-origin"), null);
});
