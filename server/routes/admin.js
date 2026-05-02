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
            .populate('student', 'name email phone rsuTranche gradeCurrent')
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
        const populatedRequest = await Request.findById(request._id)
            .populate('student', 'name email phone rsuTranche gradeCurrent')
            .populate('donor', 'name email');
        res.json(populatedRequest);
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

        // Remove from DB (File collection) only if it's a local URL
        if (!doc.url.startsWith('http')) {
            // Extract ID from URL /api/files/:id
            const parts = doc.url.split('/');
            const fileId = parts[parts.length - 1];

            try {
                await File.findByIdAndDelete(fileId);
            } catch (err) {
                console.error("Erreur suppression fichier DB:", err);
            }
        } else {
            // Optionally, delete from Cloudinary here using public_id
            // We skip it for now to keep it simple, the asset remains orphaned on Cloudinary.
        }

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
        const { name, email, role, isValidated, phone, rsuTranche } = req.body;

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
        if (rsuTranche) user.rsuTranche = rsuTranche;

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
                // Delete files (local DB files only)
                if (request.documents && request.documents.length > 0) {
                    const fileIds = request.documents
                        .filter(d => !d.url.startsWith('http'))
                        .map(d => d.url.split('/').pop());
                    
                    if (fileIds.length > 0) {
                        try {
                            await File.deleteMany({ _id: { $in: fileIds } });
                        } catch (err) {
                            console.error("Erreur suppression fichiers:", err);
                        }
                    }
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

// --- ANALYTICS ---
router.get('/analytics', auth, adminAuth, async (req, res) => {
    try {
        const Request = require('../models/Request');
        const AIFeedback = require('../models/AIFeedback');

        // 1. L'Engagement des Donateurs (Taux de conversion)
        const totalValidatedDonors = await User.countDocuments({ role: 'donor', isValidated: true });
        // Distinct donors who have picked a request
        const activeDonorsArr = await Request.distinct('donor', { donor: { $ne: null } });
        const activeDonors = activeDonorsArr.length;
        const donorEngagementRate = totalValidatedDonors > 0 ? ((activeDonors / totalValidatedDonors) * 100).toFixed(1) : 0;

        // 2. Délai Moyen de Financement
        const paidRequests = await Request.find({ status: { $in: ['PAID', 'CONFIRMED'] } });
        let avgFundingTimeDays = 0;
        if (paidRequests.length > 0) {
            let totalTimeMs = 0;
            paidRequests.forEach(req => {
                // Approximate time: find the action that set status to PAID
                const paidAction = req.history.find(h => h.action.includes('-> PAID') || h.action.includes('-> CONFIRMED'));
                const endDate = paidAction ? new Date(paidAction.date) : new Date(req.updatedAt);
                const startDate = new Date(req.createdAt);
                totalTimeMs += (endDate - startDate);
            });
            avgFundingTimeDays = (totalTimeMs / paidRequests.length) / (1000 * 60 * 60 * 24);
        }

        // 3. Top des Besoins Financiers
        const allRequests = await Request.find({ status: { $ne: 'DRAFT' } });
        const needsMap = {};
        allRequests.forEach(req => {
            req.needs.forEach(need => {
                const cat = need.category || 'Autre';
                needsMap[cat] = (needsMap[cat] || 0) + 1;
            });
        });
        const topNeeds = Object.keys(needsMap).map(k => ({ name: k, value: needsMap[k] })).sort((a, b) => b.value - a.value);

        // 4. Précision de l'IA
        const allFeedbacks = await AIFeedback.find().populate('userId', 'name role');
        const totalResolved = allFeedbacks.filter(f => f.status !== 'pending').length;
        const totalIgnored = allFeedbacks.filter(f => f.status === 'ignored').length; // IA avait raison
        const aiAccuracyRate = totalResolved > 0 ? ((totalIgnored / totalResolved) * 100).toFixed(1) : 100;

        // 5. Motifs de blocage (approximation via mots-clés ou direct aiReason si court)
        const blockReasonsMap = {};
        allFeedbacks.forEach(f => {
            // Simplify reason to a keyword or keep it if short enough
            let reason = f.aiReason;
            if (reason.length > 30) {
                if (reason.toLowerCase().includes('téléphone') || reason.toLowerCase().includes('numéro')) reason = 'Partage de Téléphone';
                else if (reason.toLowerCase().includes('bancaire') || reason.toLowerCase().includes('rib')) reason = 'Données Bancaires';
                else if (reason.toLowerCase().includes('mail') || reason.toLowerCase().includes('contact')) reason = 'Partage Email';
                else reason = 'Autre (Non respect charte)';
            }
            blockReasonsMap[reason] = (blockReasonsMap[reason] || 0) + 1;
        });
        const topBlockReasons = Object.keys(blockReasonsMap).map(k => ({ name: k, value: blockReasonsMap[k] }));

        // 6. Blocages par Utilisateur (Récidivistes)
        const userBlocksMap = {};
        allFeedbacks.forEach(f => {
            if (f.userId) {
                const key = `${f.userId.name} (${f.userId.role === 'student' ? 'Étudiant' : 'Donateur'})`;
                userBlocksMap[key] = (userBlocksMap[key] || 0) + 1;
            }
        });
        const topBlockedUsers = Object.keys(userBlocksMap)
            .map(k => ({ name: k, blocks: userBlocksMap[k] }))
            .sort((a, b) => b.blocks - a.blocks)
            .slice(0, 10); // Top 10

        res.json({
            donorEngagementRate,
            activeDonors,
            totalValidatedDonors,
            avgFundingTimeDays: avgFundingTimeDays.toFixed(1),
            topNeeds,
            aiAccuracyRate,
            totalAIReports: allFeedbacks.length,
            totalResolvedReports: totalResolved,
            topBlockReasons,
            topBlockedUsers
        });

    } catch (err) {
        console.error("Analytics Error:", err.message);
        res.status(500).send('Erreur serveur analytiques');
    }
});

module.exports = router;
