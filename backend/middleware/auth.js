const jwt = require("jsonwebtoken");
const users = require("../repositories/users");

/**
 * Verifies the Bearer token AND that the account still exists and the token
 * has not been revoked (password reset bumps user.token_version).
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

    if (typeof decoded.id !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(decoded.id)) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    const user = await users.findById(decoded.id);

    if (!user || (decoded.tv ?? 0) !== (user.token_version ?? 0)) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.userId = user.id;
    next();
};
