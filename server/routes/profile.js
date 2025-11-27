const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get current user profile
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Update user profile
router.put('/', auth, async (req, res) => {
    try {
        const {
            address, educationLevel, studyField, rsuScore, resources, description,
            gradeCurrent, gradeN1, gradeN2, gradeN3, transcriptStatus
        } = req.body;

        const userFields = {};
        if (address) userFields.address = address;
        if (educationLevel) userFields.educationLevel = educationLevel;
        if (studyField) userFields.studyField = studyField;
        if (rsuScore) userFields.rsuScore = rsuScore;
        if (resources) userFields.resources = resources;
        if (description) userFields.description = description;
        if (gradeCurrent) userFields.gradeCurrent = gradeCurrent;
        if (gradeN1) userFields.gradeN1 = gradeN1;
        if (gradeN2) userFields.gradeN2 = gradeN2;
        if (gradeN3) userFields.gradeN3 = gradeN3;
        if (transcriptStatus) userFields.transcriptStatus = transcriptStatus;

        let user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: userFields },
            { new: true }
        ).select('-password');

        res.json(user);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
