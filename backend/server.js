const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const resumeRoutes = require("./routes/resume");

dotenv.config();

// Connect MongoDB
connectDB();

const app = express();

// ======================
// Middleware
// ======================

app.use(cors());
app.use(express.json());

// ======================
// Routes
// ======================

// Authentication routes
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