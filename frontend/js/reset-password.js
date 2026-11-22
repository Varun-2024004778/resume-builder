const resetPasswordForm =
    document.getElementById("resetPasswordForm");

// Read the one-time token once, then remove it from the address bar so it does
// not linger in browser history or get copied along with the URL.
const token =
    new URLSearchParams(window.location.search).get("token");

if (token) {
    window.history.replaceState(null, "", window.location.pathname);
}

resetPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const password =
        document.getElementById("newPassword").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    if (password.length < 10) {
        alert("Password must be at least 10 characters.");
        return;
    }

    if (!token) {
        alert("Reset token is missing.");
        return;
    }

    try {
        const response = await fetch(
            API_BASE + "/api/reset-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, password })
            }
        );

        const data = await response.json();
        alert(data.message);

        if (response.ok) {
            window.location.href = "login.html";
        }
    } catch (error) {
        console.error(error);
        alert("Unable to connect to the server.");
    }
});
