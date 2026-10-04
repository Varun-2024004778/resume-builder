const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        contact: {
            firstname: {
                type: String,
                required: true
            },

            lastname: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            },

            email: {
                type: String,
                required: true
            },

            address: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            },

            country: {
                type: String,
                required: true
            },

            postalcode: {
                type: String,
                required: true
            }
        },

        education: {
            type: Array,
            default: []
        },

        skills: {
            type: Array,
            default: []
        },

        projects: {
            type: Array,
            default: []
        },

        summary: {
            type: String,
            default: ""
        },

        // =========================
        // CV Completion Status
        // =========================

        isCompleted: {
            type: Boolean,
            default: false
        }
    },

    {
        timestamps: true
    }
);

module.exports = mongoose.model("Resume", resumeSchema);