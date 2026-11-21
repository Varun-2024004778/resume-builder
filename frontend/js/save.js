const saveButton = document.createElement("button");
saveButton.type = "button";
saveButton.className = "global-save-btn";
saveButton.textContent = "Save CV";
document.body.appendChild(saveButton);

const style = document.createElement("style");
style.textContent = `
.global-save-btn {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 1000;
    border: none;
    border-radius: 999px;
    padding: 13px 22px;
    background: #16a34a;
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 8px 24px rgba(22, 163, 74, 0.35);
    cursor: pointer;
}
.global-save-btn:hover { background: #15803d; }
.global-save-btn:disabled { opacity: 0.7; cursor: wait; }
@media (max-width: 600px) {
    .global-save-btn { right: 12px; bottom: 12px; }
}
`;
document.head.appendChild(style);

function getToken() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return null;
    }
    return token;
}

async function saveSection(path, body) {
    const token = getToken();
    if (!token) return;

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(
            `http://127.0.0.1:5000/api/resume${path}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();
        alert(data.message || "Saved successfully.");
    } catch (error) {
        console.error(error);
        alert("Unable to connect to the server.");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save CV";
    }
}

function saveContact() {
    const values = {
        firstname: document.getElementById("firstname")?.value.trim(),
        lastname: document.getElementById("lastname")?.value.trim(),
        phone: document.getElementById("phone")?.value.trim(),
        email: document.getElementById("email")?.value.trim(),
        address: document.getElementById("address")?.value.trim(),
        city: document.getElementById("city")?.value.trim(),
        state: document.getElementById("state")?.value.trim(),
        country: document.getElementById("country")?.value.trim(),
        postalcode: document.getElementById("postalcode")?.value.trim()
    };

    if (Object.values(values).some((value) => !value)) {
        alert("Please fill all contact fields.");
        return;
    }

    saveSection("/contact", values);
}

function saveEducation() {
    const values = {
        institution: document.getElementById("name")?.value.trim(),
        location: document.getElementById("location")?.value.trim(),
        degree: document.getElementById("degree")?.value.trim(),
        graduationDate: document.getElementById("date")?.value,
        enrolled: document.getElementById("enrolled")?.checked
    };

    if (!values.institution || !values.location || !values.degree) {
        alert("Please fill all required education fields.");
        return;
    }

    saveSection("/education", values);
}

function saveSkills() {
    const form = document.getElementById("skillsForm");
    const skills = [];

    form?.querySelectorAll('input[type="checkbox"]:checked')
        .forEach((checkbox) => skills.push(checkbox.value));

    const otherSkills =
        document.getElementById("skills")?.value
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean) || [];

    skills.push(...otherSkills);

    if (skills.length === 0) {
        alert("Please select at least one skill.");
        return;
    }

    saveSection("/skills", { skills });
}

function saveProjects() {
    const projects = [];

    document.querySelectorAll(".project-card").forEach((card) => {
        const title = card.querySelector(".project-title")?.value.trim();
        const description =
            card.querySelector(".project-description")?.value.trim();
        const stack = card.querySelector(".project-stack")?.value.trim();
        const github = card.querySelector(".project-github")?.value.trim();

        if (title && description && stack) {
            projects.push({ title, description, stack, github });
        }
    });

    if (projects.length === 0) {
        alert("Please enter at least one project.");
        return;
    }

    saveSection("/projects", { projects });
}

function saveSummary() {
    const summary =
        document.getElementById("summary")?.value.trim();

    if (!summary) {
        alert("Please enter your professional summary.");
        return;
    }

    saveSection("/summary", { summary });
}

async function confirmSavedCV() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/resume",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        alert(response.ok
            ? "Your CV is saved."
            : data.message || "Unable to confirm saved CV.");
    } catch (error) {
        console.error(error);
        alert("Unable to connect to the server.");
    }
}

saveButton.addEventListener("click", () => {
    const page = window.location.pathname.split("/").pop();

    if (page === "contact.html") saveContact();
    else if (page === "education.html") saveEducation();
    else if (page === "skills.html") saveSkills();
    else if (page === "projects.html") saveProjects();
    else if (page === "summary.html") saveSummary();
    else confirmSavedCV();
});
