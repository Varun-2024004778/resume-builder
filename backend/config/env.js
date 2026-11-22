const WEAK_SECRET_MARKERS = ["replace-with", "change-me", "changeme", "your-secret", "example"];

const isProduction = () => process.env.NODE_ENV === "production";

/**
 * Fail fast on unsafe configuration. Called once at startup, after dotenv.
 */
function validateEnv() {
    const errors = [];
    const secret = process.env.JWT_SECRET || "";

    if (secret.length < 32) {
        errors.push(
            "JWT_SECRET must be at least 32 characters. Generate one with: " +
            "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
        );
    } else if (WEAK_SECRET_MARKERS.some((m) => secret.toLowerCase().includes(m))) {
        errors.push("JWT_SECRET still contains the placeholder value from .env.example.");
    }

    if (!process.env.MONGO_URI) {
        errors.push("MONGO_URI is not configured.");
    }

    if (isProduction()) {
        const frontend = process.env.FRONTEND_URL || "";
        if (!/^https:\/\//i.test(frontend)) {
            errors.push("FRONTEND_URL must be set to an https:// URL when NODE_ENV=production.");
        }
        const hops = Number.parseInt(process.env.TRUST_PROXY || "0", 10);
        if (!(hops > 0)) {
            console.warn(
                "⚠️  TRUST_PROXY is not set. If this app runs behind a reverse proxy " +
                "(Render, Heroku, Nginx, Cloudflare...), set TRUST_PROXY=1 or every user " +
                "will share one rate-limit bucket."
            );
        }
    }

    if (!process.env.RESEND_API_KEY) {
        console.warn("⚠️  RESEND_API_KEY is not set: password-reset emails will not be sent.");
    }

    if (errors.length > 0) {
        throw new Error("Invalid configuration:\n - " + errors.join("\n - "));
    }
}

module.exports = { validateEnv, isProduction };
