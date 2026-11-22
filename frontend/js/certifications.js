const certificationsContainer =
    document.getElementById("certificationsContainer");
const addCertificationBtn =
    document.getElementById("addCertificationBtn");
const nextBtn =
    document.getElementById("nextBtn");
let certificationCount = 0;

function createCertificationCard(certification = {}) {
    certificationCount++;
    const card = document.createElement("div");
    card.className = "project-card certification-card";
    card.innerHTML = `
        <h3>Certification ${certificationCount}</h3>
        <div class="form-group">
            <label for="cert-name-${certificationCount}">Certification Name</label>
            <input type="text" id="cert-name-${certificationCount}" class="cert-name"
                value="${escapeAttribute(certification.name)}"
                placeholder="Example: AWS Certified Solutions Architect" required>
        </div>
        <div class="form-group">
            <label for="cert-issuer-${certificationCount}">Issuing Organization</label>
            <input type="text" id="cert-issuer-${certificationCount}" class="cert-issuer"
                value="${escapeAttribute(certification.issuer)}"
                placeholder="Example: Amazon Web Services" required>
        </div>
        <div class="form-group">
            <label for="cert-date-${certificationCount}">Issue Date</label>
            <input type="month" id="cert-date-${certificationCount}" class="cert-date"
                value="${escapeAttribute(certification.issueDate)}">
        </div>
        <div class="form-group">
            <label for="cert-expiry-${certificationCount}">Expiration Date</label>
            <input type="month" id="cert-expiry-${certificationCount}" class="cert-expiry"
                value="${escapeAttribute(certification.expiryDate)}">
        </div>
        <div class="form-group">
            <label for="cert-url-${certificationCount}">Credential URL</label>
            <input type="url" id="cert-url-${certificationCount}" class="cert-url"
                value="${escapeAttribute(certification.url)}"
                placeholder="https://credential.example.com">
        </div>
        <button type="button" class="primary-btn remove-certification-btn">
            Remove Certification
        </button>
        <br><br>
    `;

    certificationsContainer.appendChild(card);
    card.querySelector(".remove-certification-btn").addEventListener("click", () => {
        card.remove();
    });
}

function escapeAttribute(value) {
    if (!value) return "";
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

async function loadCertifications() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Please login first.");
        window.location.href = "login.html";
        return;
    }

    try {
        const response = await fetch("http://127.0.0.1:5000/api/resume", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        const saved =
            response.ok && data.resume?.certifications
                ? data.resume.certifications
                : [];

        if (saved.length > 0) {
            saved.forEach(createCertificationCard);
        } else {
            createCertificationCard();
        }
    } catch (error) {
        console.error(error);
        createCertificationCard();
    }
}

addCertificationBtn.addEventListener("click", () => {
    createCertificationCard();
});

nextBtn.addEventListener("click", async () => {
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
        alert("Please enter at least one certification.");
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
            "http://127.0.0.1:5000/api/resume/certifications",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ certifications })
            }
        );
        const data = await response.json();

        if (response.ok) {
            window.location.href = "summary.html";
        } else {
            alert(data.message || "Failed to save certifications.");
        }
    } catch (error) {
        console.error(error);
        alert("Unable to connect to the server.");
    }
});

loadCertifications();
