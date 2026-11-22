const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const rateLimit = require("express-rate-limit");

dotenv.config({
    path: path.join(__dirname, ".env")
});

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resume");

// Connect MongoDB
connectDB();

const app = express();

// ======================
// Middleware
// ======================

const frontendOrigin =
    (process.env.FRONTEND_URL || "http://127.0.0.1:5500")
        .replace(/\/$/, "");

app.use(cors({
    origin: (origin, callback) => {
        if (
            !origin ||
            origin === frontendOrigin ||
            origin === "http://localhost:5500"
        ) {
            callback(null, true);
            return;
        }

        callback(new Error("Origin not allowed"));
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// ======================
// Routes
// ======================

// Authentication routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many requests. Please try again later."
    }
});

app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
app.use("/api/forgot-password", authLimiter);
app.use("/api/reset-password", authLimiter);
app.use("/api", authRoutes);

// Resume routes
app.use("/api/resume", resumeRoutes);

// ======================
// Test Route
// ======================

app.get("/", (req, res) => {
    res.send("🚀 Backend is running successfully!");
});

// ======================
// Start Server
// ======================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});