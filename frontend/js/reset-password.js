const resetPasswordForm =
    document.getElementById("resetPasswordForm");

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

    const token =
        new URLSearchParams(window.location.search).get("token");

    if (!token) {
        alert("Reset token is missing.");
        return;
    }

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/reset-password",
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
