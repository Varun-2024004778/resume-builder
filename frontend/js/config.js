// ============================================================
// Central API configuration - the ONLY place the API address lives.
//
// Local development (page opened from localhost / 127.0.0.1 / file://):
//   talks to http://127.0.0.1:5000 automatically.
//
// Production: set PRODUCTION_API_BASE to your HTTPS API origin, e.g.
//   const PRODUCTION_API_BASE = "https://api.yourdomain.com";
// or leave it empty ("") if the API is served from the same origin as
// this site (reverse proxy forwarding /api to the backend).
// ============================================================
const PRODUCTION_API_BASE = "";

(function () {
    const host = window.location.hostname;
    const isLocal = host === "" || host === "localhost" || host === "127.0.0.1";

    window.API_BASE = (isLocal ? "http://127.0.0.1:5000" : PRODUCTION_API_BASE)
        .replace(/\/+$/, "");

    // Never send passwords or tokens over plain HTTP from a secure page.
    if (window.location.protocol === "https:" && window.API_BASE.startsWith("http://")) {
        console.error("Insecure API_BASE: refusing to talk to an http:// API from an https:// page.");
        window.API_BASE = "about:invalid";
    }
})();
