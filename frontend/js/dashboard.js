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

        localStorage.removeItem("token");

        alert("Logged out successfully.");

        window.location.href = "login.html";

    }

});

// =========================
// Create New CV
// =========================

const createCV = document.getElementById("createCV");

createCV.addEventListener("click", () => {

    window.location.href = "contact.html";

});

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