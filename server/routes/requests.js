const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Request = require('../models/Request');
const User = require('../models/User');

// Create a request (Student)
router.post('/', auth, async (req, res) => {
    try {
        // Check if student already has a request
        let request = await Request.findOne({ student: req.user.id });
        if (request) {
            return res.status(400).json({ message: 'Vous avez déjà une demande en cours' });
        }

        const { amountNeeded } = req.body;

        request = new Request({
            student: req.user.id,
            amountNeeded,
            status: 'SUBMITTED',
            history: [{ action: 'Soumission du dossier', user: 'Étudiant' }]
        });

        await request.save();
        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Get requests (Donor: all submitted/analyzing/etc, Student: own)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const request = await Request.findOne({ student: req.user.id }).populate('student', 'name studies description rsuScore gradeCurrent');
            if (!request) return res.json(null);
            return res.json([request]);
        } else if (req.user.role === 'donor') {
            // Donors see submitted requests or requests they are handling
            const requests = await Request.find({
                $or: [
                    { status: 'SUBMITTED' },
                    { donor: req.user.id }
                ]
            }).populate('student', 'name email phone address educationLevel studyField rsuScore resources description gradeCurrent gradeN1 gradeN2 gradeN3 transcriptStatus');
            res.json(requests);
        } else {
            // Admin sees all
            const requests = await Request.find().populate('student', 'name');
            res.json(requests);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Update status (Lifecycle)
router.put('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        // Logic for status transitions
        // Donor: SUBMITTED -> ANALYZING
        if (status === 'ANALYZING' && req.user.role === 'donor') {
            if (request.status !== 'SUBMITTED') return res.status(400).json({ message: 'Transition invalide' });
            request.donor = req.user.id;
        }
        // Donor: ANALYZING -> REQUEST_INFO
        else if (status === 'REQUEST_INFO' && req.user.role === 'donor') {
            if (request.status !== 'ANALYZING' || request.donor.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
        }
        // Donor: ANALYZING -> VALIDATED
        else if (status === 'VALIDATED' && req.user.role === 'donor') {
            if (request.status !== 'ANALYZING' || request.donor.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
        }
        // Student: VALIDATED -> ACCEPTED
        else if (status === 'ACCEPTED' && req.user.role === 'student') {
            if (request.status !== 'VALIDATED' || request.student.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
        }
        // Donor: ACCEPTED -> PAID
        else if (status === 'PAID' && req.user.role === 'donor') {
            if (request.status !== 'ACCEPTED' || request.donor.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
        }
        // Student: PAID -> CONFIRMED
        else if (status === 'CONFIRMED' && req.user.role === 'student') {
            if (request.status !== 'PAID' || request.student.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
        }
        // Release (Donor cancels analysis): ANALYZING -> SUBMITTED
        else if (status === 'SUBMITTED' && req.user.role === 'donor') {
            if (request.status !== 'ANALYZING' || request.donor.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
            request.donor = null;
        }
        else {
            return res.status(400).json({ message: 'Action non autorisée ou statut invalide' });
        }

        request.status = status;
        request.history.push({
            action: `Changement de statut : ${status}`,
            user: req.user.role // Should be name but simplified for now
        });

        await request.save();
        res.json(request);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
