const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const path = require("path");
const rateLimit = require("express-rate-limit");

dotenv.config({
    path: path.join(__dirname, ".env")
});

const { validateEnv, isProduction } = require("./config/env");
validateEnv(); // refuse to start with a missing/weak JWT_SECRET, etc.

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resume");

// Connect MongoDB
connectDB();

const app = express();

// ======================
// Proxy awareness
// ======================
// Behind a reverse proxy (Render, Heroku, Nginx, Cloudflare...) every request
// appears to come from the proxy. Set TRUST_PROXY to the number of proxy hops
// so req.ip (and therefore rate limiting) is the real client address.
// Leave it unset when the app is exposed directly: otherwise clients could
// spoof X-Forwarded-For to dodge the limits.
const trustProxyHops = Number.parseInt(process.env.TRUST_PROXY || "0", 10);
if (trustProxyHops > 0) {
    app.set("trust proxy", trustProxyHops);
}

// ======================
// Middleware
// ======================

app.use(helmet()); // security headers, removes X-Powered-By

const frontendOrigin =
    (process.env.FRONTEND_URL || "http://127.0.0.1:5500")
        .replace(/\/$/, "");

const allowedOrigins = new Set([frontendOrigin]);
if (!isProduction()) {
    // Local development origins only
    allowedOrigins.add("http://localhost:5500");
    allowedOrigins.add("http://127.0.0.1:5500");
}

app.use(cors({
    origin: (origin, callback) => {
        // No Origin header = non-browser client (curl, server-to-server).
        // CORS is not an auth boundary; the API authenticates every request.
        // Disallowed browser origins simply get no CORS headers (no 500/stack).
        callback(null, !origin || allowedOrigins.has(origin));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "100kb" }));

// ======================
// Rate limiting
// ======================

const WINDOW_15_MIN = 15 * 60 * 1000;
const limiterDefaults = { standardHeaders: true, legacyHeaders: false };
const tooMany = { message: "Too many requests. Please try again later." };

// Login: only failed attempts count. One limit per IP, one per target account
// (so a botnet spreading guesses over many IPs still hits a wall).
const loginIpLimiter = rateLimit({
    ...limiterDefaults, windowMs: WINDOW_15_MIN, limit: 20,
    skipSuccessfulRequests: true, message: tooMany
});
const loginAccountLimiter = rateLimit({
    ...limiterDefaults, windowMs: WINDOW_15_MIN, limit: 10,
    skipSuccessfulRequests: true, message: tooMany,
    keyGenerator: (req) => `acct:${String(req.body?.email ?? "").trim().toLowerCase().slice(0, 254)}`
});
const registerLimiter = rateLimit({
    ...limiterDefaults, windowMs: 60 * 60 * 1000, limit: 10, message: tooMany
});
const forgotLimiter = rateLimit({
    ...limiterDefaults, windowMs: 60 * 60 * 1000, limit: 5, message: tooMany
});
const resetLimiter = rateLimit({
    ...limiterDefaults, windowMs: 60 * 60 * 1000, limit: 10, message: tooMany
});
const resumeLimiter = rateLimit({
    ...limiterDefaults, windowMs: WINDOW_15_MIN, limit: 300, message: tooMany
});

// ======================
// Routes
// ======================

app.use("/api/login", loginIpLimiter, loginAccountLimiter);
app.use("/api/register", registerLimiter);
app.use("/api/forgot-password", forgotLimiter);
app.use("/api/reset-password", resetLimiter);
app.use("/api", authRoutes);

app.use("/api/resume", resumeLimiter, resumeRoutes);

// Health / test route
app.get("/", (req, res) => {
    res.send("🚀 Backend is running successfully!");
});

// ======================
// Error handling (never leak stack traces)
// ======================

app.use((req, res) => {
    res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON body" });
    }
    if (err.type === "entity.too.large") {
        return res.status(413).json({ message: "Request body too large" });
    }
    console.error(err);
    res.status(500).json({ message: "Server Error" });
});

// ======================
// Start Server
// ======================

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
