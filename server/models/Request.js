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
        enum: ['DRAFT', 'SUBMITTED', 'ANALYZING', 'REQUEST_INFO', 'INFO_RECEIVED', 'VALIDATED', 'ACCEPTED', 'PAID', 'CONFIRMED', 'PARTIALLY_FUNDED'],
        default: 'DRAFT'
    },
    amountNeeded: {
        type: Number,
        required: true
    },
    alreadyFunded: {
        type: Number,
        default: 0
    },
    currentContribution: {
        type: Number,
        default: 0
    },
    fundingHistory: [{
        donor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    needs: [{
        category: {
            type: String,
            required: true,
            enum: ['Scolarité', 'Livres et Matériel', 'Transport', 'Logement', 'Autre']
        },
        amount: {
            type: Number,
            required: true,
            min: 1
        },
        description: {
            type: String
        }
    }],
    documents: [documentSchema],
    exchanges: [{
        date: {
            type: Date,
            default: Date.now
        },
        type: { type: String }, // 'MESSAGE' ou 'RESPONSE'
        message: String,
        from: String  // 'Donateur' ou 'Étudiant'
    }],
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
