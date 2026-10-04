const skillsForm = document.getElementById("skillsForm");
const nextBtn = document.getElementById("nextBtn");


// =========================
// Load Existing Skills
// =========================

async function loadSkillsData() {

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
            !data.resume.skills ||
            data.resume.skills.length === 0
        ) {
            return;
        }


        const savedSkills = data.resume.skills;


        // Get all checkboxes

        const checkboxes =
            skillsForm.querySelectorAll(
                'input[type="checkbox"]'
            );


        // Select saved checkbox skills

        checkboxes.forEach((checkbox) => {

            if (savedSkills.includes(checkbox.value)) {

                checkbox.checked = true;

            }

        });


        // Find skills that aren't in the checkbox list

        const checkboxValues =
            Array.from(checkboxes).map(
                checkbox => checkbox.value
            );


        const otherSkills =
            savedSkills.filter(
                skill => !checkboxValues.includes(skill)
            );


        // Put other skills into textarea

        if (otherSkills.length > 0) {

            document.getElementById("skills").value =
                otherSkills.join(", ");

        }


    } catch (error) {

        console.error(
            "Error loading skills:",
            error
        );

    }

}


// =========================
// Save / Update Skills
// =========================

nextBtn.addEventListener("click", async () => {

    const selectedSkills = [];


    // Get selected checkbox skills

    const checkboxes =
        skillsForm.querySelectorAll(
            'input[type="checkbox"]:checked'
        );


    checkboxes.forEach((checkbox) => {

        selectedSkills.push(
            checkbox.value
        );

    });


    // Get other skills

    const otherSkills =
        document.getElementById("skills")
            .value
            .trim();


    if (otherSkills) {

        const additionalSkills =
            otherSkills
                .split(",")
                .map(skill => skill.trim())
                .filter(skill => skill !== "");

        selectedSkills.push(
            ...additionalSkills
        );

    }


    // Check skills

    if (selectedSkills.length === 0) {

        alert(
            "Please select at least one skill."
        );

        return;

    }


    // Get token

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
            "http://127.0.0.1:5000/api/resume/skills",
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`

                },

                body: JSON.stringify({
                    skills: selectedSkills
                })

            }
        );


        const data =
            await response.json();


        if (response.ok) {

            alert(
                "Skills saved successfully!"
            );

            window.location.href =
                "projects.html";

        } else {

            alert(
                data.message ||
                "Failed to save skills."
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
// Load saved skills
// =========================

loadSkillsData();