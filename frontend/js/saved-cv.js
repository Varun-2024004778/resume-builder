const savedCVContainer =
    document.getElementById("savedCVContainer");


// =========================
// Load Saved CV
// =========================

async function loadSavedCV() {

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

            savedCVContainer.innerHTML = `
                <p>
                    ${data.message || "No saved CV found."}
                </p>
            `;

            return;
        }


        const resume = data.resume;


        savedCVContainer.innerHTML = `

            <div class="saved-cv-card">

                <h2>
                    My Professional CV
                </h2>

                <p>
                    Status:
                    <strong>
                        ${resume.isCompleted
                            ? "✓ Completed"
                            : "In Progress"}
                    </strong>
                </p>

                <p>
                    Last Updated:
                    ${new Date(
                        resume.updatedAt
                    ).toLocaleDateString()}
                </p>


                <div class="saved-cv-buttons">

                    <button
                        type="button"
                        class="primary-btn"
                        id="viewCVBtn"
                    >
                        View CV
                    </button>


                    <button
                        type="button"
                        class="primary-btn"
                        id="editCVBtn"
                    >
                        Edit CV
                    </button>

                </div>

            </div>

        `;


        // =========================
        // View CV
        // =========================

        document
            .getElementById("viewCVBtn")
            .addEventListener("click", () => {

                window.location.href =
                    "preview.html";

            });


        // =========================
        // Edit CV
        // =========================

        document
            .getElementById("editCVBtn")
            .addEventListener("click", () => {

                window.location.href =
                    "contact.html";

            });


    } catch (error) {

        console.error(error);

        savedCVContainer.innerHTML = `
            <p>
                Unable to connect to the server.
            </p>
        `;

    }

}


loadSavedCV();