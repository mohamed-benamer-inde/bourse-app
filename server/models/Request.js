const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: String,
    url: String,
    type: String,
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const requestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['DRAFT', 'SUBMITTED', 'ANALYZING', 'REQUEST_INFO', 'VALIDATED', 'ACCEPTED', 'PAID', 'CONFIRMED'],
        default: 'DRAFT'
    },
    amountNeeded: {
        type: Number,
        required: true
    },
    documents: [documentSchema],
    history: [{
        date: {
            type: Date,
            default: Date.now
        },
        action: String,
        user: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Request', requestSchema);
