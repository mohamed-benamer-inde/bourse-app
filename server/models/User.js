const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'donor', 'admin'],
        default: 'student'
    },
    // Student specific fields
    address: String,
    phone: String,
    educationLevel: String,
    studyField: String,
    rsuScore: Number,
    resources: Number,
    description: String,
    gradeCurrent: String,
    gradeN1: String,
    gradeN2: String,
    gradeN3: String,
    transcriptStatus: {
        type: String,
        enum: ['none', 'analyzing', 'valid', 'invalid'],
        default: 'none'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
