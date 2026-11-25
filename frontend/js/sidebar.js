const sidebarPages = [
    { label: "Dashboard", page: "dashboard.html", icon: "⌂" },
    { label: "Create CV", page: "intro.html", icon: "✎" },
    { label: "Contact", page: "contact.html", icon: "1" },
    { label: "Education", page: "education.html", icon: "2" },
    { label: "Experience", page: "experience.html", icon: "3" },
    { label: "Skills", page: "skills.html", icon: "4" },
    { label: "Projects", page: "projects.html", icon: "5" },
    { label: "Certifications", page: "certifications.html", icon: "6" },
    { label: "Summary", page: "summary.html", icon: "7" },
    { label: "Preview CV", page: "preview.html", icon: "◉" },
    { label: "Saved CV", page: "saved-cv.html", icon: "▣" }
];

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const SESSION_STARTED_KEY = "sessionStartedAt";
let sessionStartedAt = Number(localStorage.getItem(SESSION_STARTED_KEY));

if (!Number.isFinite(sessionStartedAt) || sessionStartedAt <= 0 || sessionStartedAt > Date.now()) {
    sessionStartedAt = Date.now();
    localStorage.setItem(SESSION_STARTED_KEY, String(sessionStartedAt));
}

window.logoutDreamCV = async (sessionExpired = false) => {
    if (window.logoutInProgress) return;
    window.logoutInProgress = true;
    window.isSessionAutoLogout = sessionExpired;

    let saved = true;
    try {
        if (typeof window.saveCurrentCV === "function") {
            saved = await window.saveCurrentCV();
        }
    } catch (error) {
        console.error("Could not save the current CV section before logout:", error);
        saved = false;
    }

    const token = localStorage.getItem("token");
    if (token) {
        try {
            const response = await fetch(`${API_BASE}/api/logout`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                console.error("Could not revoke session on the server:", await response.text());
            }
        } catch (error) {
            console.error("Could not revoke session on the server:", error);
        }
    }

    localStorage.removeItem("token");
    localStorage.removeItem(SESSION_STARTED_KEY);
    if (sessionExpired && !saved) {
        alert("Your 12-hour session expired. The current section could not be saved; please sign in and save it again.");
    } else if (sessionExpired) {
        alert("Your 12-hour session has expired. Your current CV section was saved.");
    }
    window.location.href = "login.html";
};

const sessionExpiresAt = sessionStartedAt + SESSION_DURATION_MS;
window.setTimeout(
    () => window.logoutDreamCV(true),
    Math.max(0, sessionExpiresAt - Date.now())
);

window.addEventListener("storage", (event) => {
    if ((event.key === "token" || event.key === SESSION_STARTED_KEY) && !localStorage.getItem("token")) {
        window.location.href = "login.html";
    }
});

if (!document.querySelector(".sidebar")) {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "login.html";
    }

    const currentPage =
        window.location.pathname.split("/").pop();

    const aside = document.createElement("aside");
    aside.className = "shared-sidebar";
    aside.innerHTML = `
        <div class="shared-sidebar-logo">
            Dream <span>CV</span>
            <button type="button" class="shared-sidebar-close" aria-label="Close navigation">×</button>
        </div>
        <nav class="shared-sidebar-nav" aria-label="CV navigation">
            ${sidebarPages.map((item) => `
                <a
                    href="${item.page}"
                    class="shared-sidebar-link ${
                        item.page === currentPage ? "active" : ""
                    }"
                >
                    <span class="shared-sidebar-icon">${item.icon}</span>
                    <span>${item.label}</span>
                </a>
            `).join("")}
        </nav>
        <button type="button" class="shared-sidebar-logout">
            Logout
        </button>
    `;

    document.body.insertAdjacentElement("afterbegin", aside);

    const logoutButton =
        aside.querySelector(".shared-sidebar-logout");

    logoutButton.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
            window.logoutDreamCV(false);
        }
    });

    document.documentElement.classList.add(
        "shared-sidebar-active"
    );
}

const existingSidebar =
    document.querySelector(".sidebar") ||
    document.querySelector(".shared-sidebar");

if (existingSidebar) {
    let closeButton =
        existingSidebar.querySelector(".shared-sidebar-close");

    if (!closeButton) {
        closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "shared-sidebar-close";
        closeButton.setAttribute("aria-label", "Close navigation");
        closeButton.textContent = "×";
        existingSidebar.insertAdjacentElement("afterbegin", closeButton);
    }

    const hamburger = document.createElement("button");
    hamburger.type = "button";
    hamburger.className = "sidebar-menu-button";
    hamburger.setAttribute("aria-label", "Open navigation");
    hamburger.setAttribute("aria-expanded", "false");
    hamburger.innerHTML = '<span></span><span></span><span></span>';

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "sidebar-backdrop";
    backdrop.setAttribute("aria-label", "Close navigation");

    document.body.appendChild(hamburger);
    document.body.appendChild(backdrop);

    function closeSidebar() {
        existingSidebar.classList.remove("open");
        backdrop.classList.remove("open");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.classList.remove("sidebar-drawer-open");
        hamburger.classList.remove("open");
    }

    hamburger.addEventListener("click", () => {
        const isOpen = existingSidebar.classList.toggle("open");
        backdrop.classList.toggle("open", isOpen);
        document.body.classList.toggle("sidebar-drawer-open", isOpen);
        hamburger.setAttribute("aria-expanded", String(isOpen));
        hamburger.classList.toggle("open", isOpen);
    });

    backdrop.addEventListener("click", closeSidebar);
    closeButton.addEventListener("click", closeSidebar);

    existingSidebar.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeSidebar);
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) closeSidebar();
    });
}

if (!document.getElementById("shared-sidebar-styles")) {
    const style = document.createElement("style");
    style.id = "shared-sidebar-styles";
    style.textContent = `
.shared-sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 900;
    width: 230px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    background: #111827;
    color: #fff;
    box-shadow: 6px 0 24px rgba(17, 24, 39, 0.12);
}
.shared-sidebar-logo {
    margin-bottom: 28px;
    padding: 0 10px;
    font-size: 24px;
    font-weight: 700;
}
.shared-sidebar-logo span { color: #818cf8; }
.shared-sidebar-close {
    display: none;
}
.shared-sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.shared-sidebar-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 10px 12px;
    border-radius: 10px;
    color: #d1d5db;
    text-decoration: none;
    transition: 0.2s;
}
.shared-sidebar-link:hover,
.shared-sidebar-link.active {
    background: #4f46e5;
    color: #fff;
}
.shared-sidebar-icon {
    width: 24px;
    text-align: center;
    font-weight: 700;
}
.shared-sidebar-logout {
    margin-top: auto;
    border: none;
    border-radius: 10px;
    padding: 12px;
    background: #ef4444;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
}
.shared-sidebar-logout:hover { background: #dc2626; }
.shared-sidebar-active body {
    padding-left: 230px;
}
.top-header,
.preview-container {
    width: 100%;
}
@media (max-width: 900px) {
    .shared-sidebar-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        margin-left: auto;
        border: none;
        border-radius: 8px;
        background: #374151;
        color: #fff;
        font-size: 24px;
        line-height: 1;
        cursor: pointer;
    }
    .shared-sidebar-logo,
    .sidebar-logo {
        width: 100%;
        align-items: center;
        justify-content: flex-start;
    }
    .shared-sidebar,
    .sidebar {
        width: 230px;
        min-height: 100vh;
        height: 100vh;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        padding: 18px 16px;
        overflow-y: auto;
    }
    .shared-sidebar.open,
    .sidebar.open {
        transform: translateX(0);
    }
    .shared-sidebar-logo,
    .sidebar-logo {
        display: flex;
        font-size: 24px;
    }
    .shared-sidebar-logo::before,
    .sidebar-logo::before {
        content: none;
    }
    .shared-sidebar-link,
    .sidebar-link {
        justify-content: flex-start;
        padding: 10px 12px;
    }
    .shared-sidebar-link span:last-child,
    .sidebar-link span:not(.icon) {
        display: inline;
    }
    .shared-sidebar-logout,
    .sidebar-bottom {
        display: block;
        font-size: 15px;
    }
    .shared-sidebar-logout::before {
        content: none;
    }
    .shared-sidebar-active body,
    body.sidebar-drawer-open,
    body {
        padding-left: 0;
    }
    .sidebar-menu-button {
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 1001;
        width: 46px;
        height: 46px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        border: none;
        border-radius: 10px;
        background: #4f46e5;
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.28);
        cursor: pointer;
    }
    .sidebar-menu-button span {
        width: 21px;
        height: 2px;
        border-radius: 2px;
        background: #fff;
    }
    .sidebar-menu-button.open {
        display: none;
    }
    .sidebar-backdrop {
        position: fixed;
        inset: 0;
        z-index: 899;
        display: none;
        border: 0;
        background: rgba(17, 24, 39, 0.45);
    }
    .sidebar-backdrop.open {
        display: block;
    }
    .top-header {
        padding-left: 76px;
    }
}
@media (min-width: 901px) {
    .sidebar-menu-button,
    .sidebar-backdrop {
        display: none;
    }
}
@media (max-width: 600px) {
    .shared-sidebar,
    .sidebar {
        width: min(280px, 85vw);
        inset: 0 auto 0 0;
        min-height: 100vh;
        height: 100vh;
        padding: 18px 12px;
    }
    .shared-sidebar-nav,
    .sidebar-nav {
        height: auto;
        flex-direction: column;
        justify-content: flex-start;
        overflow-y: auto;
    }
    .shared-sidebar-link,
    .sidebar-link {
        min-width: 0;
        min-height: 44px;
    }
    .shared-sidebar-active body,
    body {
        padding-left: 0;
        padding-bottom: 0;
    }
}
`;
    document.head.appendChild(style);
}
