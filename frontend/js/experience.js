const experienceContainer =
    document.getElementById("experienceContainer");
const addExperienceBtn =
    document.getElementById("addExperienceBtn");
const nextBtn =
    document.getElementById("nextBtn");
let experienceCount = 0;

function escapeAttribute(value) {
    if (!value) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function createExperienceCard(experience = {}) {
    experienceCount++;
    const card = document.createElement("div");
    card.className = "project-card experience-card";
    card.innerHTML = `
        <h3>Experience ${experienceCount}</h3>
        <div class="form-group">
            <label for="company-${experienceCount}">Company</label>
            <input type="text" id="company-${experienceCount}" class="experience-company"
                value="${escapeAttribute(experience.company)}" placeholder="Company name" required>
        </div>
        <div class="form-group">
            <label for="role-${experienceCount}">Job Title</label>
            <input type="text" id="role-${experienceCount}" class="experience-role"
                value="${escapeAttribute(experience.role)}" placeholder="Your job title" required>
        </div>
        <div class="form-group">
            <label for="location-${experienceCount}">Location</label>
            <input type="text" id="location-${experienceCount}" class="experience-location"
                value="${escapeAttribute(experience.location)}" placeholder="City, Country">
        </div>
        <div class="form-group">
            <label for="start-${experienceCount}">Start Date</label>
            <input type="month" id="start-${experienceCount}" class="experience-start"
                value="${escapeAttribute(experience.startDate)}">
        </div>
        <div class="form-group">
            <label for="end-${experienceCount}">End Date</label>
            <input type="month" id="end-${experienceCount}" class="experience-end"
                value="${escapeAttribute(experience.endDate)}">
        </div>
        <div class="form-group">
            <label>
                <input type="checkbox" class="experience-current"
                    ${experience.current ? "checked" : ""}>
                I currently work here
            </label>
        </div>
        <div class="form-group">
            <label for="description-${experienceCount}">Responsibilities</label>
            <textarea id="description-${experienceCount}" class="experience-description"
                rows="5" placeholder="Describe your responsibilities and achievements">${escapeAttribute(experience.description)}</textarea>
        </div>
        <button type="button" class="primary-btn remove-experience-btn">Remove Experience</button>
        <br><br>
    `;
    experienceContainer.appendChild(card);
    card.querySelector(".remove-experience-btn").addEventListener("click", () => card.remove());
}

async function loadExperience() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(API_BASE + "/api/resume", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        const saved = response.ok ? data.resume?.experience || [] : [];
        if (saved.length) saved.forEach(createExperienceCard);
        else createExperienceCard();
    } catch (error) {
        console.error(error);
        createExperienceCard();
    }
}

addExperienceBtn.addEventListener("click", () => createExperienceCard());

nextBtn.addEventListener("click", async () => {
    const experience = [];

    document.querySelectorAll(".experience-card").forEach((card) => {
        const company = card.querySelector(".experience-company")?.value.trim();
        const role = card.querySelector(".experience-role")?.value.trim();
        const location = card.querySelector(".experience-location")?.value.trim();
        const startDate = card.querySelector(".experience-start")?.value;
        const endDate = card.querySelector(".experience-end")?.value;
        const current = card.querySelector(".experience-current")?.checked;
        const description = card.querySelector(".experience-description")?.value.trim();

        if (company && role) {
            experience.push({ company, role, location, startDate, endDate, current, description });
        }
    });

    if (!experience.length) {
        alert("Please enter at least one work experience.");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch(
            API_BASE + "/api/resume/experience",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ experience })
            }
        );
        const data = await response.json();

        if (response.ok) {
            window.location.href = "skills.html";
        } else {
            alert(data.message || "Failed to save work experience.");
        }
    } catch (error) {
        console.error(error);
        alert("Unable to connect to the server.");
    }
});

loadExperience();
