/**
 * Small, dependency-free input validators. Every function either returns a
 * clean value or throws ValidationError (mapped to HTTP 400 by the routes).
 */
class ValidationError extends Error {}

const isPlainObject = (x) => x !== null && typeof x === "object" && !Array.isArray(x);

function text(value, label, { max = 200, required = false } = {}) {
    if (value === undefined || value === null || value === "") {
        if (required) throw new ValidationError(`${label} is required`);
        return "";
    }
    if (typeof value !== "string") {
        throw new ValidationError(`${label} must be text`);
    }
    const trimmed = value.trim();
    if (!trimmed) {
        if (required) throw new ValidationError(`${label} is required`);
        return "";
    }
    if (trimmed.length > max) {
        throw new ValidationError(`${label} must be at most ${max} characters`);
    }
    return trimmed;
}

// Accepts YYYY-MM (month inputs) and YYYY-MM-DD (date inputs); empty is allowed.
function dateString(value, label) {
    const t = text(value, label, { max: 10 });
    if (t && !/^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/.test(t)) {
        throw new ValidationError(`${label} is not a valid date`);
    }
    return t;
}

// Empty is allowed; otherwise must parse as an http(s) URL.
function httpUrl(value, label, max = 500) {
    const t = text(value, label, { max });
    if (!t) return "";
    let url;
    try {
        url = new URL(t);
    } catch (error) {
        throw new ValidationError(`${label} must be a valid link`);
    }
    if (!["http:", "https:"].includes(url.protocol)) {
        throw new ValidationError(`${label} must start with http:// or https://`);
    }
    return t;
}

function list(value, label, { min = 1, max, emptyMessage }) {
    if (!Array.isArray(value) || value.length < min) {
        throw new ValidationError(emptyMessage || `${label} is required`);
    }
    if (value.length > max) {
        throw new ValidationError(`${label} can have at most ${max} entries`);
    }
    return value;
}

function entry(value, label) {
    if (!isPlainObject(value)) {
        throw new ValidationError(`Invalid ${label} entry`);
    }
    return value;
}

module.exports = { ValidationError, text, dateString, httpUrl, list, entry };
