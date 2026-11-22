const escapeHtml = (s) =>
    String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

/**
 * Sends the password-reset email through Resend. Throws on any failure; the
 * caller decides what to do (it must NOT change the HTTP response, otherwise
 * failures reveal which emails are registered).
 */
async function sendPasswordResetEmail(to, resetUrl) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: process.env.RESEND_FROM || "Dream CV <onboarding@resend.dev>",
            to: [to],
            subject: "Reset your Dream CV password",
            text:
                `Reset your password using this link:\n\n${resetUrl}\n\n` +
                "This link expires in 30 minutes. If you did not request it, ignore this email.",
            html:
                `<p>Reset your password using the link below:</p>` +
                `<p><a href="${escapeHtml(resetUrl)}">Reset Password</a></p>` +
                `<p>This link expires in 30 minutes. If you did not request it, ignore this email.</p>`
        }),
        signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
        // Log the status only; provider bodies can echo recipient addresses.
        throw new Error(`Resend API responded with HTTP ${response.status}`);
    }
}

module.exports = { sendPasswordResetEmail };
