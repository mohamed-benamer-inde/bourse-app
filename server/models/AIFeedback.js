const mongoose = require('mongoose');

const AIFeedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userRole: {
        type: String,
        required: true
    },
    originalText: {
        type: String,
        required: true
    },
    aiReason: {
        type: String,
        required: true
    },
    context: {
        type: String,
        default: 'général'
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'ignored'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AIFeedback', AIFeedbackSchema);
