const summaryForm = document.getElementById("summaryForm");


// =========================
// Load Existing Summary
// =========================

async function loadSummary() {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/resume",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return;
        }

        if (data.resume && data.resume.summary) {

            document.getElementById("summary").value =
                data.resume.summary;

        }

    } catch (error) {

        console.error(
            "Error loading summary:",
            error
        );

    }

}


// =========================
// Save / Update Summary
// =========================

summaryForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const summary =
        document.getElementById("summary")
            .value
            .trim();


    if (!summary) {

        alert(
            "Please enter your professional summary."
        );

        return;

    }


    const token =
        localStorage.getItem("token");


    if (!token) {

        alert("Please login first.");

        window.location.href =
            "login.html";

        return;

    }


    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/resume/summary",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`

                },

                body: JSON.stringify({
                    summary
                })

            }
        );


        const data =
            await response.json();


        if (response.ok) {

            alert(
                "Summary saved successfully!"
            );

            window.location.href =
                "preview.html";

        } else {

            alert(
                data.message ||
                "Failed to save summary."
            );

        }


    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to the server."
        );

    }

});


// =========================
// Load saved summary
// =========================

loadSummary();