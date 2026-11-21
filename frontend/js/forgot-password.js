const forgotPasswordForm =
    document.getElementById("forgotPasswordForm");

forgotPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email =
        document.getElementById("forgotEmail").value.trim();

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/forgot-password",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message);
            return;
        }

        alert(data.message);
    } catch (error) {
        console.error(error);
        alert("Unable to connect to the server.");
    }
});
