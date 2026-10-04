// ----------------------
// Register User
// ----------------------

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {

            const response = await fetch("http://127.0.0.1:5000/api/register", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name,
                    email,
                    password
                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {
                window.location.href = "login.html";
            }

        } catch (error) {

            alert("Server is not running.");

            console.error(error);

        }

    });

}


// ----------------------
// Login User
// ----------------------

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {

            const response = await fetch("http://127.0.0.1:5000/api/login", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email,
                    password
                })

            });

            const data = await response.json();

            alert(data.message);

            if (response.ok) {

                // Save token
                localStorage.setItem("token", data.token);

                // Redirect to dashboard
                window.location.href = "dashboard.html";

            }

        } catch (error) {

            alert("Server is not running.");

            console.error(error);

        }

    });

}