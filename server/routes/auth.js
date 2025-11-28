const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');

// CAPTCHA Secret (should be in env, but using a default for now)
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'secure_captcha_secret_key';

// Helper to hash captcha
const hashCaptcha = (text) => {
    return crypto.createHmac('sha256', CAPTCHA_SECRET).update(text.toLowerCase()).digest('hex');
};

// Get CAPTCHA
res.status(200).json({
    image: captcha.data,
    token: token
});
});

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, captchaAnswer, captchaToken } = req.body;

        // Verify CAPTCHA
        if (!captchaAnswer || !captchaToken) {
            return res.status(400).json({ message: 'Veuillez remplir le CAPTCHA' });
        }

        if (hashCaptcha(captchaAnswer) !== captchaToken) {
            return res.status(400).json({ message: 'CAPTCHA incorrect' });
        }

        // Force role to be student or donor only (no public admin creation)
        const allowedRoles = ['student', 'donor'];
        const userRole = allowedRoles.includes(role) ? role : 'student';

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Utilisateur déjà existant' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        user = new User({
            name,
            email,
            password: hashedPassword,
            role: userRole,
            isValidated: userRole === 'student' // Donors need validation
        });

        await user.save();

        // Create token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Identifiants invalides' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides' });
        }

        // Check validation for donors
        if (user.role === 'donor' && !user.isValidated) {
            return res.status(403).json({ message: 'Votre compte est en attente de validation par un administrateur.' });
        }

        // Create token
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, ...user._doc } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
