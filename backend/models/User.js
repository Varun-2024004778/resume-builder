const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 254
    },

    password: {
        type: String,
        required: true
    },

    // Incremented on password reset. Tokens carry the version they were
    // issued under, so bumping it revokes every existing session.
    tokenVersion: {
        type: Number,
        default: 0
    },

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);
