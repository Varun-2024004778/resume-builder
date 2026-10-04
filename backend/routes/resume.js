const express = require("express");
const router = express.Router();

const Resume = require("../models/Resume");
const jwt = require("jsonwebtoken");

// =========================
// Authentication Middleware
// =========================

const authenticateUser = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.userId = decoded.id;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }
};


/// =========================
// Save / Update Contact
// =========================

router.post("/contact", authenticateUser, async (req, res) => {

    try {

        const {
            firstname,
            lastname,
            phone,
            email,
            address,
            city,
            state,
            country,
            postalcode
        } = req.body;


        // Check required fields

        if (
            !firstname ||
            !lastname ||
            !phone ||
            !email ||
            !address ||
            !city ||
            !state ||
            !country ||
            !postalcode
        ) {

            return res.status(400).json({
                message: "Please fill all the fields"
            });

        }


        // Find existing resume

        let resume = await Resume.findOne({
            userId: req.userId
        });


        // If resume doesn't exist, create it

        if (!resume) {

            resume = new Resume({
                userId: req.userId
            });

        }


        // Update contact information

        resume.contact = {

            firstname,
            lastname,
            phone,
            email,
            address,
            city,
            state,
            country,
            postalcode

        };


        // Save resume

        await resume.save();


        res.status(200).json({

            message: "Contact information saved successfully",

            resumeId: resume._id

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message: "Failed to save contact information"

        });

    }

});


// =========================
// Save / Update Education
// =========================

router.post("/education", authenticateUser, async (req, res) => {

    try {

        const {
            institution,
            location,
            degree,
            graduationDate,
            enrolled
        } = req.body;


        // Check required fields

        if (
            !institution ||
            !location ||
            !degree
        ) {

            return res.status(400).json({
                message:
                    "Please fill all the required education fields"
            });

        }


        // Find existing resume

        const resume = await Resume.findOne({
            userId: req.userId
        });


        if (!resume) {

            return res.status(404).json({
                message:
                    "Resume not found. Please complete contact information first."
            });

        }


        // Update existing education

        resume.education = [
            {
                institution,
                location,
                degree,
                graduationDate,
                enrolled
            }
        ];


        // Save resume

        await resume.save();


        res.status(200).json({

            message:
                "Education information saved successfully"

        });


    } catch (error) {

        console.error(error);

        res.status(500).json({

            message:
                "Failed to save education information"

        });

    }

});

// =========================
// Save / Update Skills
// =========================

router.post("/skills", authenticateUser, async (req, res) => {

    try {

        const { skills } = req.body;

        // Check skills
        if (
            !skills ||
            !Array.isArray(skills) ||
            skills.length === 0
        ) {

            return res.status(400).json({
                message: "Please select at least one skill"
            });

        }

        // Find existing resume
        const resume = await Resume.findOne({
            userId: req.userId
        });

        if (!resume) {

            return res.status(404).json({
                message:
                    "Resume not found. Please complete contact information first."
            });

        }

        // Replace old skills with updated skills
        resume.skills = skills;

        // Save resume
        await resume.save();

        res.status(200).json({
            message: "Skills saved successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to save skills"
        });

    }

});

// =========================
// Save Projects Information
// =========================

router.post("/projects", authenticateUser, async (req, res) => {

    try {

        const { projects } = req.body;

        // Check projects
        if (!projects || !Array.isArray(projects) || projects.length === 0) {

            return res.status(400).json({
                message: "Please add at least one project"
            });

        }

        // Find the user's resume
        const resume = await Resume.findOne({
            userId: req.userId
        });

        if (!resume) {

            return res.status(404).json({
                message: "Resume not found. Please complete contact information first."
            });

        }

        // Save projects
        resume.projects = projects;

        // Save updated resume
        await resume.save();

        res.status(200).json({
            message: "Projects saved successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to save projects"
        });

    }

});


// =========================
// Save Professional Summary
// =========================

router.post("/summary", authenticateUser, async (req, res) => {

    try {

        const { summary } = req.body;

        // Check summary
        if (!summary || !summary.trim()) {

            return res.status(400).json({
                message: "Please enter your professional summary"
            });

        }

        // Find the user's resume
        const resume = await Resume.findOne({
            userId: req.userId
        });

        if (!resume) {

            return res.status(404).json({
                message: "Resume not found. Please complete your CV information first."
            });

        }

        // Save summary
        resume.summary = summary;

        // Mark CV as completed if all required sections are filled
        resume.isCompleted = true;

        // Save updated resume
        await resume.save();

        res.status(200).json({
            message: "Summary saved successfully"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to save summary"
        });

    }

});


// =========================
// Get Complete CV
// =========================

router.get("/", authenticateUser, async (req, res) => {

    try {

        // Find the resume of the logged-in user
        const resume = await Resume.findOne({
            userId: req.userId
        });

        if (!resume) {

            return res.status(404).json({
                message: "Resume not found"
            });

        }

        res.status(200).json({
            resume
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load CV"
        });

    }

});

module.exports = router;