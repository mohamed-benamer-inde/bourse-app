const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// CAPTCHA Secret (should be in env, but using a default for now)
const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'secure_captcha_secret_key';

// Helper to hash captcha
const hashCaptcha = (text) => {
    return crypto.createHmac('sha256', CAPTCHA_SECRET).update(text.toLowerCase()).digest('hex');
};

// Get CAPTCHA
router.get('/captcha', (req, res) => {
    const captcha = svgCaptcha.create({
        size: 5,
        noise: 2,
        color: true,
        background: '#f0f0f0'
    });

    const token = hashCaptcha(captcha.text);

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
                
                // Set httpOnly cookie
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });

                res.json({ user: { id: user.id, name: user.name, role: user.role, email: user.email } });
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

        // Check if account is locked
        if (user.lockUntil && user.lockUntil > Date.now()) {
            return res.status(403).json({ message: 'Compte verrouillé suite à trop de tentatives. Réessayez dans 15 minutes.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Increment login attempts
            user.loginAttempts += 1;
            
            // Lock account if >= 5 attempts
            if (user.loginAttempts >= 5) {
                user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
            }
            await user.save();
            
            return res.status(400).json({ message: 'Identifiants invalides' });
        }

        // Reset login attempts and lock on successful login
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

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
                
                // Set httpOnly cookie
                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 24 * 60 * 60 * 1000 // 24 hours
                });

                res.json({ user: { id: user.id, name: user.name, role: user.role, email: user.email, ...user._doc } });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Déconnexion réussie' });
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Il n'y a pas d'utilisateur avec cette adresse email" });
        }

        // Generate token
        const resetToken = crypto.randomBytes(20).toString('hex');

        // Hash token and set to resetPasswordToken field
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set expire (1 hour)
        user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;

        await user.save();

        // Create reset url
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        const message = `
            <h1>Vous avez demandé une réinitialisation de mot de passe</h1>
            <p>Veuillez vous rendre sur ce lien pour réinitialiser votre mot de passe:</p>
            <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Réinitialisation de mot de passe',
                message
            });

            res.status(200).json({ message: 'Email envoyé' });
        } catch (err) {
            console.error(err);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save();
            return res.status(500).json({ message: "L'email n'a pas pu être envoyé" });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Reset Password
router.put('/reset-password/:token', async (req, res) => {
    try {
        // Get hashed token
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Jeton invalide ou expiré' });
        }

        // Set new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Mot de passe mis à jour avec succès' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
