// =========================
// Preview CV
// =========================

const fullNameElement = document.getElementById("fullName");
const contactDetailsElement = document.getElementById("contactDetails");
const summaryElement = document.getElementById("summary");
const educationContainer = document.getElementById("educationContainer");
const skillsContainer = document.getElementById("skillsContainer");
const projectsContainer = document.getElementById("projectsContainer");


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
                    project.github
                        ? `
                            <p>
                                <a
                                    class="project-link"
                                    href="${escapeHTML(project.github)}"
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

}


// =========================
// Prevent HTML Injection
// =========================

function escapeHTML(value) {

    if (!value) {
        return "";
    }

    const div = document.createElement("div");

    div.textContent = value;

    return div.innerHTML;

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