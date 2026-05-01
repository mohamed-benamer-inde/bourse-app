const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AIFeedback = require('../models/AIFeedback');

// POST /api/feedback/ai
// Submit a false-positive report for AI validation
router.post('/ai', auth, async (req, res) => {
    try {
        const { originalText, aiReason, context } = req.body;

        if (!originalText || !aiReason) {
            return res.status(400).json({ message: 'Données incomplètes' });
        }

        const newFeedback = new AIFeedback({
            userId: req.user.id,
            userRole: req.user.role,
            originalText,
            aiReason,
            context: context || 'général',
            status: 'pending'
        });

        await newFeedback.save();

        res.status(201).json({ message: 'Signalement enregistré avec succès', feedback: newFeedback });
    } catch (err) {
        console.error('Error submitting AI feedback:', err.message);
        res.status(500).send('Erreur serveur');
    }
});

// GET /api/feedback/ai
// Get all AI feedback reports (Admin only)
router.get('/ai', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const feedbacks = await AIFeedback.find().sort({ createdAt: -1 }).populate('userId', 'name email');
        res.json(feedbacks);
    } catch (err) {
        console.error('Error fetching AI feedback:', err.message);
        res.status(500).send('Erreur serveur');
    }
});

// PUT /api/feedback/ai/:id/status
// Update feedback status (Admin only)
router.put('/ai/:id/status', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }

        const { status } = req.body;
        const validStatuses = ['pending', 'reviewed', 'ignored'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const feedback = await AIFeedback.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!feedback) {
            return res.status(404).json({ message: 'Signalement non trouvé' });
        }

        res.json(feedback);
    } catch (err) {
        console.error('Error updating AI feedback status:', err.message);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
