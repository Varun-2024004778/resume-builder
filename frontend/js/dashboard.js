// =========================
// Check if user is logged in
// =========================

const token = localStorage.getItem("token");

if (!token) {
    alert("Please login first.");
    window.location.href = "login.html";
}

// =========================
// Logout
// =========================

const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {

    const confirmLogout = confirm("Are you sure you want to logout?");

    if (confirmLogout) {
        window.logoutDreamCV(false);

    }

});

// =========================
// Create New CV
// =========================

const createCV = document.getElementById("createCV");

if (createCV) {
    createCV.addEventListener("click", () => {

        window.location.href = "contact.html";

    });
}

// =========================
// Resume Templates
// =========================

const templateCards =
    document.querySelectorAll(".template-card");

let selectedTemplate =
    localStorage.getItem("resumeTemplate") || "executive";

function renderSelectedTemplate() {
    templateCards.forEach((card) => {
        const isSelected =
            card.dataset.template === selectedTemplate;

        card.classList.toggle("selected", isSelected);
        card.setAttribute("aria-pressed", String(isSelected));
    });
}

templateCards.forEach((card) => {
    card.addEventListener("click", () => {
        selectedTemplate = card.dataset.template;
        localStorage.setItem("resumeTemplate", selectedTemplate);
        renderSelectedTemplate();
        window.location.href = "intro.html";
    });
});

renderSelectedTemplate();

// =========================
// My Saved CVs
// =========================

const savedCVButton =
    document.querySelector("a[href='saved-cv.html'] button");

if (savedCVButton) {
    savedCVButton.addEventListener("click", () => {
        window.location.href = "saved-cv.html";
    });
}

// =========================
// My Profile
// =========================

const profileButton = document.getElementById("viewProfile");

if (profileButton) {
    profileButton.addEventListener("click", () => {
        alert("Profile page will be available soon!");
    });
}

// =========================
// Settings
// =========================

const settingsButton =
    document.querySelectorAll(".dashboard-card button")[3];

if (settingsButton) {
    settingsButton.addEventListener("click", () => {
        alert("Settings page will be available soon!");
    });
}