const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

/**
 * Verifies the Bearer token AND that the account still exists and the token
 * has not been revoked (password reset bumps user.tokenVersion).
 */
module.exports = async function authenticateUser(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.slice(7).trim();
    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    if (typeof decoded.id !== "string" || !mongoose.isValidObjectId(decoded.id)) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.id).select("tokenVersion");

    if (!user || (decoded.tv ?? 0) !== (user.tokenVersion ?? 0)) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.userId = user._id;
    next();
};
