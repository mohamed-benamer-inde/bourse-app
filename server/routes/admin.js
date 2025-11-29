const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Middleware to check if user is admin or superadmin
const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
};

// Middleware to check if user is superadmin
const superAdminAuth = (req, res, next) => {
    if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
};

// Get all users (for admin dashboard)
router.get('/users', auth, adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Validate a donor
router.put('/users/:id/validate', auth, adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        if (user.role !== 'donor') {
            return res.status(400).json({ message: 'Seuls les donateurs peuvent être validés' });
        }

        user.isValidated = true;
        await user.save();

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Create a new Admin (SuperAdmin only)
router.post('/admins', auth, superAdminAuth, async (req, res) => {
    try {
        const { name, email, password } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'Utilisateur déjà existant' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            password: hashedPassword,
            role: 'admin',
            isValidated: true
        });

        await user.save();
        res.json({ message: 'Administrateur créé avec succès', user: { id: user.id, name: user.name, email: user.email } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// --- REQUESTS MANAGEMENT ---

// Get all requests with filters
router.get('/requests', auth, adminAuth, async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};

        if (status) {
            query.status = status;
        }

        // Search logic (requires population or aggregate, but simple find for now)
        // If search is provided, we might need to find users first then requests, or use aggregate
        // For simplicity, we'll fetch all and filter in memory or use basic population match if possible
        // Mongoose doesn't support deep population filtering easily in one go without aggregate.
        // Let's try to find users matching search first if search exists.

        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');
            const userIds = users.map(u => u._id);
            query.student = { $in: userIds };
        }

        const requests = await require('../models/Request').find(query)
            .populate('student', 'name email phone rsuScore gradeCurrent')
            .populate('donor', 'name email')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Force status change
router.put('/requests/:id/status', auth, adminAuth, async (req, res) => {
    try {
        const { status } = req.body;
        const Request = require('../models/Request');
        const request = await Request.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Demande non trouvée' });

        const oldStatus = request.status;
        request.status = status;
        request.history.push({
            action: `ADMIN: Changement statut ${oldStatus} -> ${status}`,
            user: req.user.name || 'Admin'
        });

        // If PAID, trigger purge? Maybe optional for admin, but safer to keep logic consistent
        // For now, we just change status. Admin can manually delete docs if needed.

        await request.save();
        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Delete a document
router.delete('/requests/:id/documents/:docId', auth, adminAuth, async (req, res) => {
    try {
        const Request = require('../models/Request');
        const File = require('../models/File');
        const request = await Request.findById(req.params.id);

        if (!request) return res.status(404).json({ message: 'Demande non trouvée' });

        // Find doc in array
        const docIndex = request.documents.findIndex(d => d._id.toString() === req.params.docId);
        if (docIndex === -1) return res.status(404).json({ message: 'Document non trouvé' });

        const doc = request.documents[docIndex];

        // Remove from DB (File collection)
        // Extract ID from URL /api/files/:id
        const parts = doc.url.split('/');
        const fileId = parts[parts.length - 1];

        await File.findByIdAndDelete(fileId);

        // Remove from request array
        request.documents.splice(docIndex, 1);

        request.history.push({
            action: `ADMIN: Suppression document ${doc.name}`,
            user: req.user.name || 'Admin'
        });

        await request.save();
        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// --- USERS MANAGEMENT ---

// Edit user info
router.put('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        const { name, email, role, isValidated, phone, rsuScore } = req.body;

        // Prevent changing own role to something else if it blocks admin access? 
        // Or preventing editing superadmin?
        // Simple check:
        if (req.params.id === req.user.id && role && role !== 'admin' && role !== 'superadmin') {
            return res.status(400).json({ message: 'Vous ne pouvez pas retirer vos droits d\'admin' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (isValidated !== undefined) user.isValidated = isValidated;
        if (phone) user.phone = phone;
        if (rsuScore) user.rsuScore = rsuScore;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Delete user
router.delete('/users/:id', auth, adminAuth, async (req, res) => {
    try {
        if (req.params.id === req.user.id) {
            return res.status(400).json({ message: 'Vous ne pouvez pas vous supprimer vous-même' });
        }

        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

        // Delete related data
        if (user.role === 'student') {
            const Request = require('../models/Request');
            const File = require('../models/File');

            const request = await Request.findOne({ student: user._id });
            if (request) {
                // Delete files
                if (request.documents && request.documents.length > 0) {
                    const fileIds = request.documents.map(d => d.url.split('/').pop());
                    await File.deleteMany({ _id: { $in: fileIds } });
                }
                await Request.findByIdAndDelete(request._id);
            }
        }
        // If donor, maybe unassign them from requests?
        if (user.role === 'donor') {
            const Request = require('../models/Request');
            await Request.updateMany({ donor: user._id }, { $set: { donor: null, status: 'SUBMITTED' } });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'Utilisateur supprimé' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

module.exports = router;
