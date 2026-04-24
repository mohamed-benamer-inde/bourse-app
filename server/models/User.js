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
        enum: ['student', 'donor', 'admin', 'superadmin'],
        default: 'student'
    },
    isValidated: {
        type: Boolean,
        default: function () {
            return this.role === 'student'; // Students are validated by default, donors need approval
        }
    },
    // Student specific fields
    address: String,
    phone: String,
    educationLevel: String,
    studyField: String,
    rsuTranche: {
        type: String,
        enum: [
            'Tranche 1 (Moins de 9.32)',
            'Tranche 2 (Entre 9.32 et 9.74)',
            'Tranche 3 (Entre 9.74 et 10.50)',
            'Tranche 4 (Supérieur à 10.50)',
            'Non inscrit / En cours'
        ]
    },
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
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    loginAttempts: {
        type: Number,
        required: true,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);
