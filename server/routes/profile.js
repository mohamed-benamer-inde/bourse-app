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

const { checkContent, checkInsults, checkPhoneStrict } = require('../utils/contentFilter');
const { validateWithAI } = require('../utils/aiValidation');

// Update user profile
router.put('/', auth, async (req, res) => {
    try {
        const {
            address, city, schoolAddress, phone, educationLevel, studyField, rsuTranche, resources, description,
            gradeCurrent, gradeN1, gradeN2, gradeN3, transcriptStatus
        } = req.body;

        // --- MODERATION START ---
        // 1. Strict Phone Check
        if (phone) {
            const phoneCheck = checkPhoneStrict(phone);
            if (!phoneCheck.isValid) return res.status(400).json({ message: phoneCheck.reason });
        }

        // 2. City Check (Insults only)
        if (city) {
            const cityCheck = checkInsults(city);
            if (!cityCheck.isValid) return res.status(400).json({ message: `Champ Ville : ${cityCheck.reason}` });
        }

        // 3. Free Text Fields Check
        const fieldsToValidate = {
            'lettre de motivation': description,
            'adresse personnelle': address,
            'adresse de l\'école': schoolAddress,
            'description des ressources': resources
        };

        for (const [context, value] of Object.entries(fieldsToValidate)) {
            if (value) {
                const localCheck = checkContent(value);
                if (!localCheck.isValid) {
                    return res.status(400).json({ message: `Champ "${context}" : ${localCheck.reason}` });
                }
                const aiCheck = await validateWithAI(value, context);
                if (!aiCheck.isValid) {
                    return res.status(400).json({ message: `Champ "${context}" : ${aiCheck.reason}` });
                }
            }
        }
        // --- MODERATION END ---

        const userFields = {};
        if (address) userFields.address = address;
        if (city) userFields.city = city;
        if (schoolAddress) userFields.schoolAddress = schoolAddress;
        if (phone) userFields.phone = phone;
        if (educationLevel) userFields.educationLevel = educationLevel;
        if (studyField) userFields.studyField = studyField;
        if (rsuTranche) userFields.rsuTranche = rsuTranche;
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
        console.error('Erreur PUT /profile:', err);
        res.status(500).json({ message: `Erreur Profil: ${err.message}` });
    }
});

module.exports = router;
