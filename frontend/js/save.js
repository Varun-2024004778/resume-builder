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

function showSaveMessage(message) {
    if (!window.isSessionAutoLogout) {
        alert(message);
    }
}

async function saveSection(path, body) {
    const token = getToken();
    if (!token) return false;

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(
            `${API_BASE}/api/resume${path}`,
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
        if (!response.ok) {
            showSaveMessage(data.message || "Unable to save your CV.");
            return false;
        }
        showSaveMessage(data.message || "Saved successfully.");
        return true;
    } catch (error) {
        console.error(error);
        showSaveMessage("Unable to connect to the server.");
        return false;
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
        showSaveMessage("Please fill all contact fields.");
        return false;
    }

    return saveSection("/contact", values);
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
        showSaveMessage("Please fill all required education fields.");
        return false;
    }

    return saveSection("/education", values);
}

function saveExperience() {
    const experience = [];

    document.querySelectorAll(".experience-card").forEach((card) => {
        const company = card.querySelector(".experience-company")?.value.trim();
        const role = card.querySelector(".experience-role")?.value.trim();
        const location = card.querySelector(".experience-location")?.value.trim();
        const startDate = card.querySelector(".experience-start")?.value;
        const endDate = card.querySelector(".experience-end")?.value;
        const current = card.querySelector(".experience-current")?.checked;
        const description =
            card.querySelector(".experience-description")?.value.trim();

        if (company && role) {
            experience.push({
                company,
                role,
                location,
                startDate,
                endDate,
                current,
                description
            });
        }
    });

    if (experience.length === 0) {
        showSaveMessage("Please enter at least one work experience.");
        return false;
    }

    return saveSection("/experience", { experience });
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
        showSaveMessage("Please select at least one skill.");
        return false;
    }

    return saveSection("/skills", { skills });
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
        showSaveMessage("Please enter at least one project.");
        return false;
    }

    return saveSection("/projects", { projects });
}

function saveCertifications() {
    const certifications = [];

    document.querySelectorAll(".certification-card").forEach((card) => {
        const name = card.querySelector(".cert-name")?.value.trim();
        const issuer = card.querySelector(".cert-issuer")?.value.trim();
        const issueDate = card.querySelector(".cert-date")?.value;
        const expiryDate = card.querySelector(".cert-expiry")?.value;
        const url = card.querySelector(".cert-url")?.value.trim();

        if (name && issuer) {
            certifications.push({
                name,
                issuer,
                issueDate,
                expiryDate,
                url
            });
        }
    });

    if (certifications.length === 0) {
        showSaveMessage("Please enter at least one certification.");
        return false;
    }

    return saveSection("/certifications", { certifications });
}

function saveSummary() {
    const summary =
        document.getElementById("summary")?.value.trim();

    if (!summary) {
        showSaveMessage("Please enter your professional summary.");
        return false;
    }

    return saveSection("/summary", { summary });
}

async function confirmSavedCV() {
    const token = getToken();
    if (!token) return;

    try {
        const response = await fetch(
            API_BASE + "/api/resume",
            {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();
        showSaveMessage(response.ok
            ? "Your CV is saved."
            : data.message || "Unable to confirm saved CV.");
        return response.ok;
    } catch (error) {
        console.error(error);
        showSaveMessage("Unable to connect to the server.");
        return false;
    }
}

window.saveCurrentCV = async () => {
    const page = window.location.pathname.split("/").pop();

    if (page === "contact.html") return saveContact();
    if (page === "education.html") return saveEducation();
    if (page === "experience.html") return saveExperience();
    if (page === "skills.html") return saveSkills();
    if (page === "projects.html") return saveProjects();
    if (page === "certifications.html") return saveCertifications();
    if (page === "summary.html") return saveSummary();
    return true;
};

saveButton.addEventListener("click", async () => {
    await window.saveCurrentCV();
});
