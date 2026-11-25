const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const users = require("../repositories/users");
const { sendPasswordResetEmail } = require("../utils/mailer");
const authenticateUser = require("../middleware/auth");

const router = express.Router();

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_BYTES = 72; // bcrypt silently ignores anything beyond 72 bytes
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000; // at most one reset email per account per minute
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_RESET_MESSAGE =
    "If that email is registered, a password reset link has been sent.";

// Compared against when the email is unknown so that login takes the same
// time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString("hex"), BCRYPT_ROUNDS);

const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");

function passwordError(password) {
    if (typeof password !== "string") {
        return "Password is required";
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
        return `Password is too long (maximum ${MAX_PASSWORD_BYTES} bytes)`;
    }
    return null;
}

// =====================
// Register User
// =====================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body ?? {};

        if (
            typeof name !== "string" || typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() || !email.trim() || !password
        ) {
            return res.status(400).json({ message: "Please fill all fields" });
        }

        const cleanName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (cleanName.length > 100) {
            return res.status(400).json({ message: "Name must be at most 100 characters" });
        }

        if (normalizedEmail.length > 254 || !EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }

        const pwError = passwordError(password);
        if (pwError) {
            return res.status(400).json({ message: pwError });
        }

        const existingUser = await users.findByEmail(normalizedEmail);
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

        try {
            await users.create({ name: cleanName, email: normalizedEmail, password: hashedPassword });
        } catch (error) {
            if (error.code === "23505") {
                return res.status(400).json({ message: "Email already registered" });
            }
            throw error;
        }

        res.status(201).json({ message: "Registration Successful" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});


// =====================
// Login User
// =====================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (
            typeof email !== "string" || typeof password !== "string" ||
            !email.trim() || !password
        ) {
            return res.status(400).json({ message: "Please enter email and password" });
        }

        const user = await users.findByEmail(email.trim().toLowerCase());

        // Always run a bcrypt comparison (against a dummy hash if there is no
        // such user) so response time does not reveal whether the email exists.
        const isMatch = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);

        if (!user || !isMatch) {
            return res.status(400).json({ message: "Invalid Email or Password" });
        }

        const token = jwt.sign(
            { id: String(user.id), tv: user.token_version ?? 0 },
            process.env.JWT_SECRET,
            { expiresIn: "1d", algorithm: "HS256" }
        );

        res.status(200).json({ message: "Login Successful", token });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
});

// =====================
// Forgot Password
// =====================
// The response is IDENTICAL whether or not the account exists and whether or
// not the email provider works, so this endpoint cannot be used to discover
// which addresses are registered.
router.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body ?? {};

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ message: "Please enter your email address" });
        }

        const user = await users.findByEmail(email.trim().toLowerCase());

        if (user) {
            const resetExpires = user.reset_password_expires ? new Date(user.reset_password_expires) : null;
            const lastIssuedAt = resetExpires
                ? resetExpires.getTime() - RESET_TOKEN_TTL_MS
                : 0;

            // Per-account cooldown: stops inbox flooding and token churn
            if (Date.now() - lastIssuedAt >= RESET_COOLDOWN_MS) {
                const resetToken = crypto.randomBytes(32).toString("hex");
                const hashedToken = sha256(resetToken);

                await users.setResetToken(
                    user.id,
                    hashedToken,
                    new Date(Date.now() + RESET_TOKEN_TTL_MS)
                );

                const frontendUrl = (process.env.FRONTEND_URL || "http://127.0.0.1:5500")
                    .replace(/\/$/, "");
                const resetUrl =
                    `${frontendUrl}/reset-password.html?token=${encodeURIComponent(resetToken)}`;

                // Fire-and-forget: a failure must not change the HTTP response.
                sendPasswordResetEmail(user.email, resetUrl).catch(async (error) => {
                    console.error("Password reset email failed:", error.message);
                    // Release the cooldown so the user can simply try again
                    await users.clearResetToken(user.id, hashedToken).catch(() => {});
                });
            }
        }

        return res.status(200).json({ message: GENERIC_RESET_MESSAGE });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});

// =====================
// Reset Password
// =====================
router.post("/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body ?? {};

        if (typeof token !== "string" || !token || token.length > 256 ||
            typeof password !== "string" || !password) {
            return res.status(400).json({
                message: "Reset token and new password are required"
            });
        }

        const pwError = passwordError(password);
        if (pwError) {
            return res.status(400).json({ message: pwError });
        }

        const hashedToken = sha256(token);
        const user = await users.findValidResetToken(hashedToken);
        if (!user) {
            return res.status(400).json({ message: "Reset link is invalid or has expired" });
        }

        const newHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const updated = await users.consumeResetToken(user.id, hashedToken, newHash);

        if (!updated) {
            return res.status(400).json({ message: "Reset link is invalid or has expired" });
        }

        return res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});

router.post("/logout", authenticateUser, async (req, res) => {
    try {
        await users.revokeSessions(req.userId);
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server Error" });
    }
});

module.exports = router;
