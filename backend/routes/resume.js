const express = require("express");
const router = express.Router();

const resumes = require("../repositories/resumes");
const authenticateUser = require("../middleware/auth");
const v = require("../utils/validators");

const { ValidationError } = v;

// Limits (also keep documents small and predictable)
const MAX_EXPERIENCE = 20;
const MAX_PROJECTS = 20;
const MAX_CERTIFICATIONS = 30;
const MAX_SKILLS = 60;

function fail(res, error, fallbackMessage) {
    if (error instanceof ValidationError) {
        return res.status(400).json({ message: error.message });
    }
    console.error(error);
    return res.status(500).json({ message: fallbackMessage });
}

const notFoundMessage = "Resume not found. Please complete contact information first.";


// =========================
// Save / Update Contact
// =========================

router.post("/contact", authenticateUser, async (req, res) => {
    try {
        const body = req.body ?? {};
        const fields = ["firstname", "lastname", "phone", "email", "address", "city", "state", "country", "postalcode"];

        if (fields.some((f) => !body[f])) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }

        const contact = {
            firstname: v.text(body.firstname, "First name", { max: 100, required: true }),
            lastname: v.text(body.lastname, "Last name", { max: 100, required: true }),
            phone: v.text(body.phone, "Phone", { max: 30, required: true }),
            email: v.text(body.email, "Email", { max: 254, required: true }),
            address: v.text(body.address, "Address", { max: 200, required: true }),
            city: v.text(body.city, "City", { max: 100, required: true }),
            state: v.text(body.state, "State", { max: 100, required: true }),
            country: v.text(body.country, "Country", { max: 100, required: true }),
            postalcode: v.text(body.postalcode, "Postal code", { max: 20, required: true })
        };

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }

        const resume = await resumes.createForUser(req.userId);
        await resumes.updateSection(req.userId, "contact", contact);

        res.status(200).json({
            message: "Contact information saved successfully",
            resumeId: resume.id
        });

    } catch (error) {
        fail(res, error, "Failed to save contact information");
    }
});


// =========================
// Save / Update Education
// =========================

router.post("/education", authenticateUser, async (req, res) => {
    try {
        const body = req.body ?? {};

        if (!body.institution || !body.location || !body.degree) {
            return res.status(400).json({
                message: "Please fill all the required education fields"
            });
        }

        const education = {
            institution: v.text(body.institution, "Institution", { max: 200, required: true }),
            location: v.text(body.location, "Location", { max: 200, required: true }),
            degree: v.text(body.degree, "Degree", { max: 200, required: true }),
            graduationDate: v.dateString(body.graduationDate, "Graduation date"),
            enrolled: body.enrolled === true
        };

        const resume = await resumes.findByUserId(req.userId);
        if (!resume) {
            return res.status(404).json({ message: notFoundMessage });
        }
        await resumes.updateSection(req.userId, "education", [education]);

        res.status(200).json({ message: "Education information saved successfully" });

    } catch (error) {
        fail(res, error, "Failed to save education information");
    }
});

// =========================
// Save Work Experience
// =========================

router.post("/experience", authenticateUser, async (req, res) => {
    try {
        const raw = (req.body ?? {}).experience;

        if (!Array.isArray(raw) || raw.length === 0) {
            return res.status(400).json({ message: "Please add at least one work experience" });
        }
        v.list(raw, "Work experience", { max: MAX_EXPERIENCE });

        const experience = raw.map((item) => {
            const e = v.entry(item, "experience");
            return {
                company: v.text(e.company, "Company", { max: 150, required: true }),
                role: v.text(e.role, "Job title", { max: 150, required: true }),
                location: v.text(e.location, "Location", { max: 150 }),
                startDate: v.dateString(e.startDate, "Start date"),
                endDate: v.dateString(e.endDate, "End date"),
                current: e.current === true,
                description: v.text(e.description, "Responsibilities", { max: 3000 })
            };
        });

        const resume = await resumes.findByUserId(req.userId);
        if (!resume) {
            return res.status(404).json({ message: notFoundMessage });
        }
        await resumes.updateSection(req.userId, "experience", experience);

        res.status(200).json({ message: "Work experience saved successfully" });

    } catch (error) {
        fail(res, error, "Failed to save work experience");
    }
});

// =========================
// Save / Update Skills
// =========================

router.post("/skills", authenticateUser, async (req, res) => {
    try {
        const raw = (req.body ?? {}).skills;

        if (!Array.isArray(raw) || raw.length === 0) {
            return res.status(400).json({ message: "Please select at least one skill" });
        }
        v.list(raw, "Skills", { max: MAX_SKILLS });

        // trim, drop blanks, de-duplicate case-insensitively (keeping order)
        const seen = new Set();
        const skills = [];
        for (const item of raw) {
            const skill = v.text(item, "Skill", { max: 60 });
            if (skill && !seen.has(skill.toLowerCase())) {
                seen.add(skill.toLowerCase());
                skills.push(skill);
            }
        }

        if (skills.length === 0) {
            return res.status(400).json({ message: "Please select at least one skill" });
        }

        const resume = await resumes.findByUserId(req.userId);
        if (!resume) {
            return res.status(404).json({ message: notFoundMessage });
        }
        await resumes.updateSection(req.userId, "skills", skills);

        res.status(200).json({ message: "Skills saved successfully" });

    } catch (error) {
        fail(res, error, "Failed to save skills");
    }
});

// =========================
// Save Projects Information
// =========================

router.post("/projects", authenticateUser, async (req, res) => {
    try {
        const raw = (req.body ?? {}).projects;

        if (!Array.isArray(raw) || raw.length === 0) {
            return res.status(400).json({ message: "Please add at least one project" });
        }
        v.list(raw, "Projects", { max: MAX_PROJECTS });

        const projects = raw.map((item) => {
            const p = v.entry(item, "project");
            return {
                title: v.text(p.title, "Project title", { max: 150, required: true }),
                description: v.text(p.description, "Project description", { max: 2000, required: true }),
                stack: v.text(p.stack, "Technologies", { max: 300, required: true }),
                github: v.httpUrl(p.github, "GitHub URL")
            };
        });

        const resume = await resumes.findByUserId(req.userId);
        if (!resume) {
            return res.status(404).json({ message: notFoundMessage });
        }
        await resumes.updateSection(req.userId, "projects", projects);

        res.status(200).json({ message: "Projects saved successfully" });

    } catch (error) {
        fail(res, error, "Failed to save projects");
    }
});

// =========================
// Save Certifications
// =========================

router.post("/certifications", authenticateUser, async (req, res) => {
    try {
        const raw = (req.body ?? {}).certifications;

        if (!Array.isArray(raw) || raw.length === 0) {
            return res.status(400).json({ message: "Please add at least one certification" });
        }
        v.list(raw, "Certifications", { max: MAX_CERTIFICATIONS });

        const certifications = raw.map((item) => {
            const c = v.entry(item, "certification");
            return {
                name: v.text(c.name, "Certification name", { max: 200, required: true }),
                issuer: v.text(c.issuer, "Issuing organization", { max: 200, required: true }),
                issueDate: v.dateString(c.issueDate, "Issue date"),
                expiryDate: v.dateString(c.expiryDate, "Expiration date"),
                url: v.httpUrl(c.url, "Credential URL")
            };
        });

        const resume = await resumes.findByUserId(req.userId);
        if (!resume) {
            return res.status(404).json({ message: notFoundMessage });
        }
        await resumes.updateSection(req.userId, "certifications", certifications);

        res.status(200).json({ message: "Certifications saved successfully" });

    } catch (error) {
        fail(res, error, "Failed to save certifications");
    }
});


// =========================
// Save Professional Summary
// =========================

router.post("/summary", authenticateUser, async (req, res) => {
    try {
        const rawSummary = (req.body ?? {}).summary;

        if (typeof rawSummary !== "string" || !rawSummary.trim()) {
            return res.status(400).json({ message: "Please enter your professional summary" });
        }

        const summary = v.text(rawSummary, "Summary", { max: 5000, required: true });

        const resume = await resumes.findByUserId(req.userId);
        if (!resume) {
            return res.status(404).json({
                message: "Resume not found. Please complete your CV information first."
            });
        }

        await resumes.updateSection(req.userId, "summary", summary);

        const isCompleted =
            Boolean(resume.contact?.firstname) &&
            resume.education?.length > 0 &&
            resume.experience?.length > 0 &&
            resume.skills?.length > 0 &&
            resume.projects?.length > 0 &&
            resume.certifications?.length > 0 &&
            Boolean(summary);
        await resumes.updateSection(req.userId, "is_completed", isCompleted);

        res.status(200).json({ message: "Summary saved successfully" });

    } catch (error) {
        fail(res, error, "Failed to save summary");
    }
});


// =========================
// Get Complete CV
// =========================

router.get("/", authenticateUser, async (req, res) => {
    try {
        const resume = await resumes.findByUserId(req.userId);

        if (!resume) {
            return res.status(404).json({ message: "Resume not found" });
        }

        res.status(200).json({ resume: resumes.mapResume(resume) });

    } catch (error) {
        fail(res, error, "Failed to load CV");
    }
});

module.exports = router;
