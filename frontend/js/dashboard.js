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

const savedCVButton = document.querySelectorAll(".card button")[1];

savedCVButton.addEventListener("click", () => {

    alert("My Saved CVs feature is coming soon!");

});

// =========================
// My Profile
// =========================

const profileButton = document.querySelectorAll(".card button")[2];

profileButton.addEventListener("click", () => {

    alert("Profile page will be available soon!");

});

// =========================
// Settings
// =========================

const settingsButton = document.querySelectorAll(".card button")[3];

settingsButton.addEventListener("click", () => {

    alert("Settings page will be available soon!");

});