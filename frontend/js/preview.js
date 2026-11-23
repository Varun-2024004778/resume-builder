// =========================
// Preview CV
// =========================

const resumeTemplate =
    localStorage.getItem("resumeTemplate") || "executive";
const previewContainer =
    document.querySelector(".preview-container");

if (previewContainer) {
    previewContainer.classList.add(`template-${resumeTemplate}`);
}

const fullNameElement = document.getElementById("fullName");
const initialsElement = document.getElementById("initials");
const contactDetailsElement = document.getElementById("contactDetails");
const summaryElement = document.getElementById("summary");
const educationContainer = document.getElementById("educationContainer");
const skillsContainer = document.getElementById("skillsContainer");
const experienceContainer =
    document.getElementById("experienceContainer");
const projectsContainer = document.getElementById("projectsContainer");
const certificationsContainer =
    document.getElementById("certificationsContainer");


// =========================
// Get CV Data
// =========================

async function loadCV() {

    const token = localStorage.getItem("token");

    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {

        const response = await fetch(
            API_BASE + "/api/resume",
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(
                data.message ||
                "Unable to load your CV."
            );

            return;
        }

        displayCV(data.resume);

    } catch (error) {

        console.error(error);

        alert("Unable to connect to the server.");

    }

}


// =========================
// Display CV
// =========================

function displayCV(resume) {

    // -------------------------
    // Contact Information
    // -------------------------

    const contact = resume.contact;

    if (contact) {

        fullNameElement.textContent =
            `${contact.firstname} ${contact.lastname}`;

        const names =
            `${contact.firstname || ""} ${contact.lastname || ""}`
                .trim()
                .split(/\s+/)
                .filter(Boolean);

        initialsElement.textContent =
            names
                .slice(0, 2)
                .map((name) => name.charAt(0).toUpperCase())
                .join("");

        contactDetailsElement.textContent =
            `${contact.phone} | ${contact.email} | ${contact.city}, ${contact.state}, ${contact.country}`;

    }


    // -------------------------
    // Professional Summary
    // -------------------------

    summaryElement.textContent =
        resume.summary || "No summary provided.";


    // -------------------------
    // Education
    // -------------------------

    educationContainer.innerHTML = "";

    if (
        resume.education &&
        resume.education.length > 0
    ) {

        resume.education.forEach((education) => {

            const educationItem =
                document.createElement("div");

            educationItem.classList.add(
                "education-item"
            );

            educationItem.innerHTML = `
                <h3>${escapeHTML(education.degree)}</h3>

                <p>
                    <strong>
                        ${escapeHTML(education.institution)}
                    </strong>
                </p>

                <p>
                    ${escapeHTML(education.location)}
                </p>

                ${
                    education.graduationDate
                        ? `<p>Graduation Date: ${escapeHTML(education.graduationDate)}</p>`
                        : ""
                }

                ${
                    education.enrolled
                        ? `<p>Currently Enrolled</p>`
                        : ""
                }
            `;

            educationContainer.appendChild(
                educationItem
            );

        });

    } else {

        educationContainer.innerHTML =
            "<p>No education information provided.</p>";

    }


    // -------------------------
    // Skills
    // -------------------------

    skillsContainer.innerHTML = "";

    if (
        resume.skills &&
        resume.skills.length > 0
    ) {

        const skillsList =
            document.createElement("div");

        skillsList.classList.add(
            "skills-list"
        );

        resume.skills.forEach((skill) => {

            const skillElement =
                document.createElement("span");

            skillElement.classList.add("skill");

            skillElement.textContent = skill;

            skillsList.appendChild(
                skillElement
            );

        });

        skillsContainer.appendChild(
            skillsList
        );

    } else {

        skillsContainer.innerHTML =
            "<p>No skills provided.</p>";

    }


    // -------------------------
    // Work Experience
    // -------------------------

    experienceContainer.innerHTML = "";

    if (
        resume.experience &&
        resume.experience.length > 0
    ) {
        resume.experience.forEach((experience) => {
            const experienceItem =
                document.createElement("div");

            experienceItem.classList.add(
                "experience-item"
            );

            const dates = [
                experience.startDate || "",
                experience.current
                    ? "Present"
                    : (experience.endDate || "")
            ].filter(Boolean).join(" - ");

            experienceItem.innerHTML = `
                <h3>${escapeHTML(experience.role)}</h3>
                <p><strong>${escapeHTML(experience.company)}</strong></p>
                ${experience.location ? `<p>${escapeHTML(experience.location)}</p>` : ""}
                ${dates ? `<p>${escapeHTML(dates)}</p>` : ""}
                ${experience.description ? `<p>${escapeHTML(experience.description)}</p>` : ""}
            `;

            experienceContainer.appendChild(
                experienceItem
            );
        });
    } else {
        experienceContainer.innerHTML =
            "<p>No work experience provided.</p>";
    }


    // -------------------------
    // Projects
    // -------------------------

    projectsContainer.innerHTML = "";

    if (
        resume.projects &&
        resume.projects.length > 0
    ) {

        resume.projects.forEach((project) => {

            const projectItem =
                document.createElement("div");

            projectItem.classList.add(
                "project-item"
            );

            projectItem.innerHTML = `
                <h3>
                    ${escapeHTML(project.title)}
                </h3>

                <p>
                    ${escapeHTML(project.description)}
                </p>

                <p>
                    <strong>Technologies:</strong>
                    ${escapeHTML(project.stack)}
                </p>

                ${
                    getSafeExternalURL(project.github)
                        ? `
                            <p>
                                <a
                                    class="project-link"
                                    href="${escapeHTML(getSafeExternalURL(project.github))}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    GitHub Project
                                </a>
                            </p>
                        `
                        : ""
                }
            `;

            projectsContainer.appendChild(
                projectItem
            );

        });

    } else {

        projectsContainer.innerHTML =
            "<p>No projects provided.</p>";

    }


    // -------------------------
    // Certifications
    // -------------------------

    certificationsContainer.innerHTML = "";

    if (
        resume.certifications &&
        resume.certifications.length > 0
    ) {
        resume.certifications.forEach((certification) => {
            const certificationItem =
                document.createElement("div");

            certificationItem.classList.add(
                "certification-item"
            );

            const dates = [
                certification.issueDate
                    ? `Issued ${escapeHTML(certification.issueDate)}`
                    : "",
                certification.expiryDate
                    ? `Expires ${escapeHTML(certification.expiryDate)}`
                    : ""
            ].filter(Boolean).join(" | ");

            certificationItem.innerHTML = `
                <h3>${escapeHTML(certification.name)}</h3>
                <p><strong>${escapeHTML(certification.issuer)}</strong></p>
                ${dates ? `<p>${dates}</p>` : ""}
                ${
                    getSafeExternalURL(certification.url)
                        ? `
                            <p>
                                <a
                                    class="project-link"
                                    href="${escapeHTML(getSafeExternalURL(certification.url))}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    View Credential
                                </a>
                            </p>
                        `
                        : ""
                }
            `;

            certificationsContainer.appendChild(
                certificationItem
            );
        });
    } else {
        certificationsContainer.innerHTML =
            "<p>No certifications provided.</p>";
    }

}


// =========================
// Prevent HTML Injection
// =========================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    // Escapes quotes as well, so the result is safe in text AND attribute context
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

}

function getSafeExternalURL(value) {
    if (!value) return "";

    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol)
            ? url.toString()
            : "";
    } catch (error) {
        return "";
    }
}


// =========================
// Edit CV
// =========================

document.getElementById("editBtn").addEventListener(
    "click",
    () => {

        window.location.href = "contact.html";

    }
);


// =========================
// Print / Save PDF
// =========================

document.getElementById("printBtn").addEventListener(
    "click",
    () => {

        window.print();

    }
);


// =========================
// Load CV when page opens
// =========================

loadCV();


// =========================
// Reload when coming back
// =========================

window.addEventListener("pageshow", (event) => {

    if (event.persisted) {
        loadCV();
    }

});