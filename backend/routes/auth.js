const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
}

// =====================
// Register User
// =====================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if all fields are filled
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        // Check if email already exists
        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Encrypt password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = new User({
            name,
            email: normalizedEmail,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            message: "Registration Successful"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});


// =====================
// Login User
// =====================
router.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        // Check user
        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user) {
            return res.status(400).json({
                message: "Invalid Email or Password"
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Email or Password"
            });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login Successful",
            token
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Server Error"
        });

    }

});

// =====================
// Forgot Password
// =====================
router.post("/forgot-password", async (req, res) => {
    let resetUser = null;

    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                message: "Please enter your email address"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (user) {
            resetUser = user;
            const resetToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires =
                new Date(Date.now() + 30 * 60 * 1000);
            await user.save();

            const resendApiKey = process.env.RESEND_API_KEY;

            if (!resendApiKey) {
                console.error(
                    "Password reset email not sent: Resend API key is missing"
                );
                return res.status(503).json({
                    message:
                        "Password reset email is unavailable. Please configure Resend."
                });
            }

            const frontendUrl = (
                process.env.FRONTEND_URL ||
                "http://127.0.0.1:5500"
            ).replace(/\/$/, "");
            const resetUrl =
                `${frontendUrl}/reset-password.html?token=` +
                encodeURIComponent(resetToken);

            const emailResponse = await fetch(
                "https://api.resend.com/emails",
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${resendApiKey}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        from:
                            process.env.RESEND_FROM ||
                            "Dream CV <onboarding@resend.dev>",
                        to: [user.email],
                        subject: "Reset your Dream CV password",
                        text:
                            `Reset your password using this link:\n\n${resetUrl}\n\n` +
                            "This link expires in 30 minutes.",
                        html:
                            `<p>Reset your password using the link below:</p>` +
                            `<p><a href="${resetUrl}">Reset Password</a></p>` +
                            `<p>This link expires in 30 minutes.</p>`
                    })
                }
            );

            if (!emailResponse.ok) {
                const providerError = await emailResponse.text();
                console.error(
                    `Resend API request failed: ${providerError}`
                );
                throw new Error("RESEND_PROVIDER_ERROR");
            }
        }

        return res.status(200).json({
            message:
                "If that email is registered, a password reset link has been sent."
        });
    } catch (error) {
        console.error(error);

        if (resetUser) {
            resetUser.resetPasswordToken = null;
            resetUser.resetPasswordExpires = null;
            await resetUser.save().catch(() => {});
        }

        if (error.message === "RESEND_PROVIDER_ERROR") {
            return res.status(503).json({
                message:
                    "Password reset email could not be sent. Resend testing mode may require a verified domain."
            });
        }

        return res.status(500).json({
            message: "Server Error"
        });
    }
});

// =====================
// Reset Password
// =====================
router.post("/reset-password", async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                message: "Reset token and new password are required"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            });
        }

        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                message: "Reset link is invalid or has expired"
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server Error"
        });
    }
});

module.exports = router;