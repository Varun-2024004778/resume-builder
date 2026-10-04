const educationForm = document.getElementById("educationForm");
const nextBtn = document.getElementById("nextBtn");


// =========================
// Load Existing Education
// =========================

async function loadEducationData() {

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

        if (
            !data.resume ||
            !data.resume.education ||
            data.resume.education.length === 0
        ) {
            return;
        }

        // Get the first education entry
        const education = data.resume.education[0];

        document.getElementById("name").value =
            education.institution || "";

        document.getElementById("location").value =
            education.location || "";

        document.getElementById("degree").value =
            education.degree || "";

        document.getElementById("date").value =
            education.graduationDate || "";

        document.getElementById("enrolled").checked =
            education.enrolled || false;

    } catch (error) {

        console.error(
            "Error loading education data:",
            error
        );

    }

}


// =========================
// Save / Update Education
// =========================

nextBtn.addEventListener("click", async () => {

    const educationData = {

        institution:
            document.getElementById("name").value.trim(),

        location:
            document.getElementById("location").value.trim(),

        degree:
            document.getElementById("degree").value.trim(),

        graduationDate:
            document.getElementById("date").value,

        enrolled:
            document.getElementById("enrolled").checked

    };


    // Check required fields

    if (
        !educationData.institution ||
        !educationData.location ||
        !educationData.degree
    ) {

        alert(
            "Please fill all the required education fields."
        );

        return;

    }


    // Get login token

    const token = localStorage.getItem("token");

    if (!token) {

        alert("Please login first.");

        window.location.href = "login.html";

        return;

    }


    try {

        const response = await fetch(
            "http://127.0.0.1:5000/api/resume/education",
            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json",

                    "Authorization":
                        `Bearer ${token}`

                },

                body: JSON.stringify(
                    educationData
                )

            }
        );


        const data = await response.json();


        if (response.ok) {

            alert(
                "Education information saved successfully!"
            );

            window.location.href =
                "skills.html";

        } else {

            alert(
                data.message ||
                "Failed to save education information."
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
// Load data when page opens
// =========================

loadEducationData();