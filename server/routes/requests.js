const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Request = require('../models/Request');
const User = require('../models/User');
const { sendStatusEmail } = require('../utils/notifications');
const { checkContent, checkInsults, checkPhoneStrict } = require('../utils/contentFilter');
const { validateWithAI } = require('../utils/aiValidation');

// Create a request (Student)
router.post('/', auth, async (req, res) => {
    try {
        const { amountNeeded, status, needs, documents } = req.body;

        let finalAmount = amountNeeded || 0;
        let finalNeeds = [];

        if (needs && Array.isArray(needs) && needs.length > 0) {
            // --- MODERATION START ---
            for (const item of needs) {
                if (item.label) {
                    const localCheck = checkContent(item.label);
                    if (!localCheck.isValid) return res.status(400).json({ message: `Besoin "${item.label}" : ${localCheck.reason}` });
                }
            }
            // --- MODERATION END ---
            finalAmount = needs.reduce((sum, item) => sum + Number(item.amount), 0);
            finalNeeds = needs;
        }

        // Check if student already has a request
        let request = await Request.findOne({ student: req.user.id });
        if (request) {
            if (request.status === 'DRAFT') {
                // Update draft
                request.amountNeeded = finalAmount;
                request.needs = finalNeeds;
                if (documents) request.documents = documents;
                request.status = status || 'SUBMITTED';
                if (request.status !== 'DRAFT') {
                    request.history.push({ action: 'Soumission du dossier', user: 'Étudiant' });
                }
                await request.save();
                return res.json(request);
            } else {
                return res.status(400).json({ message: 'Vous avez déjà une demande en cours' });
            }
        }

        request = new Request({
            student: req.user.id,
            amountNeeded: finalAmount,
            needs: finalNeeds,
            documents: documents || [],
            status: status || 'SUBMITTED', // Default to SUBMITTED for backward compatibility unless specified
            history: [{ action: 'Création du dossier', user: 'Étudiant' }]
        });

        await request.save();
        res.json(request);
    } catch (err) {
        console.error('Erreur POST /requests:', err);
        res.status(500).json({ message: `Erreur Request: ${err.message}` });
    }
});

// Helper to mask sensitive data
const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    if (name.length <= 2) return '***@' + domain;
    return name.substring(0, 2) + '***@' + domain;
};

const maskPhone = (phone) => {
    if (!phone) return '';
    if (phone.length <= 4) return '******';
    return phone.substring(0, 2) + '******' + phone.substring(phone.length - 2);
};

// Get requests (Donor: all submitted/analyzing/etc, Student: own)
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role === 'student') {
            const request = await Request.findOne({ student: req.user.id }).populate('student', 'name studies description rsuTranche gradeCurrent');
            if (!request) return res.json(null);
            return res.json([request]);
        } else if (req.user.role === 'donor') {
            // Donors see submitted or partially funded requests, or requests they are handling
            // EXCLUDE requests they have already funded in a previous cycle
            const requests = await Request.find({
                $and: [
                    {
                        $or: [
                            { status: 'SUBMITTED' },
                            { status: 'PARTIALLY_FUNDED' },
                            { donor: req.user.id }
                        ]
                    },
                    { "fundingHistory.donor": { $ne: req.user.id } }
                ]
            }).populate('student', 'name email phone address city educationLevel studyField rsuTranche resources description gradeCurrent gradeN1 gradeN2 gradeN3 transcriptStatus schoolAddress');
            
            // Mask sensitive data for donors
            const maskedRequests = requests.map(req => {
                const doc = req.toObject();
                if (doc.student) {
                    doc.student.email = maskEmail(doc.student.email);
                    doc.student.phone = maskPhone(doc.student.phone);
                    // Don't show full address to donor, only city
                    doc.student.address = "Masqué par sécurité";
                }
                // Anonymize history for donors (only see generic 'Donateur' or 'Admin')
                if (doc.history) {
                    doc.history = doc.history.map(h => ({
                        ...h,
                        user: h.user === 'donor' || h.user === 'donateur' || h.user === 'Donateur' ? 'Donateur' : h.user
                    }));
                }
                // Anonymize funding history for donors (REMOVE donor IDs)
                if (doc.fundingHistory) {
                    doc.fundingHistory = doc.fundingHistory.map(f => ({
                        amount: f.amount,
                        date: f.date
                    }));
                }
                return doc;
            });
            res.json(maskedRequests);
        } else {
            // Admin sees all
            const requests = await Request.find().populate('student', 'name').populate('donor', 'name');
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
        // Donor: SUBMITTED or INFO_RECEIVED -> ANALYZING (Take charge or Resume)
        if (status === 'ANALYZING' && req.user.role === 'donor') {
            const validSourceStatuses = ['SUBMITTED', 'INFO_RECEIVED', 'PARTIALLY_FUNDED'];
            if (!validSourceStatuses.includes(request.status)) {
                return res.status(400).json({ message: 'Transition invalide' });
            }

            // If resuming from INFO_RECEIVED, ensure it's the same donor
            if (request.status === 'INFO_RECEIVED' && request.donor.toString() !== req.user.id) {
                return res.status(401).json({ message: 'Non autorisé' });
            }

            if (request.status === 'SUBMITTED' || request.status === 'PARTIALLY_FUNDED') {
                request.donor = req.user.id;
            }
        }
        // Donor: ANALYZING/INFO_RECEIVED -> REQUEST_INFO
        else if (status === 'REQUEST_INFO' && req.user.role === 'donor') {
            if ((request.status !== 'ANALYZING' && request.status !== 'INFO_RECEIVED') || request.donor.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
            
            if (req.body.data && req.body.data.message) {
                // --- MODERATION START ---
                const localCheck = checkContent(req.body.data.message);
                if (!localCheck.isValid) return res.status(400).json({ message: localCheck.reason });
                const aiCheck = await validateWithAI(req.body.data.message, 'message donateur');
                if (!aiCheck.isValid) return res.status(400).json({ message: aiCheck.reason });
                // --- MODERATION END ---

                if (!request.exchanges) request.exchanges = [];
                request.exchanges.push({
                    type: 'MESSAGE',
                    message: req.body.data.message,
                    from: 'Donateur'
                });
            }
        }
        // Donor: ANALYZING/INFO_RECEIVED -> VALIDATED
        else if (status === 'VALIDATED' && req.user.role === 'donor') {
            if ((request.status !== 'ANALYZING' && request.status !== 'INFO_RECEIVED') || request.donor.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
            
            // Handle contribution amount at validation step
            if (req.body.data && req.body.data.contribution) {
                request.currentContribution = Number(req.body.data.contribution);
            } else {
                // Fallback to remaining balance if not provided
                request.currentContribution = request.amountNeeded - (request.alreadyFunded || 0);
            }
        }
        // Student: VALIDATED -> ACCEPTED
        else if (status === 'ACCEPTED' && req.user.role === 'student') {
            if (request.status !== 'VALIDATED' || request.student.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
        }
        // Donor: ACCEPTED -> PAID
        else if (status === 'PAID' && req.user.role === 'donor') {
            if (request.status !== 'ACCEPTED' || request.donor.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });

            // PURGE LOGIC: Delete all documents associated with this request
            if (request.documents && request.documents.length > 0) {
                const File = require('../models/File');
                const fileIds = request.documents
                    .filter(doc => !doc.url.startsWith('http')) // Only local files
                    .map(doc => {
                        const parts = doc.url.split('/');
                        return parts[parts.length - 1];
                    });

                try {
                    if (fileIds.length > 0) {
                        await File.deleteMany({ _id: { $in: fileIds } });
                        console.log(`Purged ${fileIds.length} local DB documents for request ${request._id}`);
                    }
                    request.documents = []; // Clear the array (both local and Cloudinary links)
                } catch (purgeErr) {
                    console.error('Error purging documents:', purgeErr);
                    // Continue even if purge fails, but log it
                }
            }
        }
        // Student: PAID -> CONFIRMED (End of cycle)
        else if (status === 'CONFIRMED' && req.user.role === 'student') {
            if (request.status !== 'PAID' || request.student.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
            
            // 1. Finalize current contribution
            const amountJustFunded = request.currentContribution || 0;
            request.alreadyFunded = (request.alreadyFunded || 0) + amountJustFunded;
            
            // 2. Add to funding history (with donor ID for filtering)
            request.fundingHistory.push({
                donor: request.donor,
                amount: amountJustFunded,
                date: new Date()
            });

            // 3. Check if more funding is needed
            if (request.alreadyFunded < request.amountNeeded) {
                // Return to market with PARTIALLY_FUNDED status
                request.status = 'PARTIALLY_FUNDED';
                request.donor = null;
                request.currentContribution = 0;
                
                request.history.push({
                    action: `Cycle de financement terminé (${amountJustFunded} DH). Remis en ligne pour le solde.`,
                    user: 'Système'
                });

                await request.save();
                const partPopulated = await Request.findById(request._id)
                    .populate('student', 'name email phone address city educationLevel studyField rsuTranche resources description gradeCurrent gradeN1 gradeN2 gradeN3 transcriptStatus');
                return res.json(partPopulated);
            }
        }
        // Release (Donor cancels analysis): ANALYZING -> SUBMITTED
        else if (status === 'SUBMITTED' && req.user.role === 'donor') {
            if (request.status !== 'ANALYZING' || request.donor.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });
            request.donor = null;
        }
        // Student: REQUEST_INFO -> INFO_RECEIVED (Response)
        else if (status === 'INFO_RECEIVED' && req.user.role === 'student') {
            if (request.status !== 'REQUEST_INFO' || request.student.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });

            // Add response to exchanges
            if (req.body.data && req.body.data.response) {
                // --- MODERATION START ---
                const localCheck = checkContent(req.body.data.response);
                if (!localCheck.isValid) return res.status(400).json({ message: localCheck.reason });
                const aiCheck = await validateWithAI(req.body.data.response, 'réponse étudiant');
                if (!aiCheck.isValid) return res.status(400).json({ message: aiCheck.reason });
                // --- MODERATION END ---

                if (!request.exchanges) request.exchanges = [];
                request.exchanges.push({
                    type: 'RESPONSE',
                    message: req.body.data.response,
                    from: 'Étudiant'
                });
            }
        }
        // Student: DRAFT -> SUBMITTED
        else if (status === 'SUBMITTED' && req.user.role === 'student') {
            if (request.status !== 'DRAFT' || request.student.toString() !== req.user.id) return res.status(400).json({ message: 'Non autorisé' });

            // --- FINAL MODERATION CHECK ---
            const student = await User.findById(req.user.id);
            
            // 1. Strict Phone Check
            const phoneCheck = checkPhoneStrict(student.phone);
            if (!phoneCheck.isValid) return res.status(400).json({ message: `Numéro de téléphone : ${phoneCheck.reason}` });

            // 2. City Check
            const cityCheck = checkInsults(student.city);
            if (!cityCheck.isValid) return res.status(400).json({ message: `Ville : ${cityCheck.reason}` });

            // 3. Free Text Fields
            const fieldsToValidate = {
                'lettre de motivation': student.description,
                'adresse de l\'école': student.schoolAddress,
                'description des ressources': student.resources,
                'filière et établissement': student.studyField
            };

            for (const [context, value] of Object.entries(fieldsToValidate)) {
                if (value) {
                    const localCheck = checkContent(value);
                    if (!localCheck.isValid) return res.status(400).json({ message: `Le dossier contient des informations non autorisées (${context}) : ${localCheck.reason}` });
                    
                    const aiCheck = await validateWithAI(value, context);
                    if (!aiCheck.isValid) return res.status(400).json({ message: `Le dossier n'est pas prêt pour soumission (${context}) : ${aiCheck.reason}` });
                }
            }
            // --- END FINAL CHECK ---
        }
        else {
            return res.status(400).json({ message: 'Action non autorisée ou statut invalide' });
        }

        request.status = status;
        request.history.push({
            action: `Changement de statut : ${status}`,
            user: req.user.role === 'student' ? 'Étudiant' : (req.user.role === 'donor' ? 'Donateur' : 'Admin')
        });

        await request.save();
        const populatedRequest = await Request.findById(request._id)
            .populate('student', 'name email phone address city educationLevel studyField rsuTranche resources description gradeCurrent gradeN1 gradeN2 gradeN3 transcriptStatus')
            .populate('donor', 'name email');

        // Send Email Notification to Student asynchronously
        try {
            if (populatedRequest.student && populatedRequest.student.email) {
                sendStatusEmail(populatedRequest.student.email, populatedRequest.student.name, status);
            }
        } catch (emailErr) {
            console.error("Error sending status email:", emailErr);
        }

        res.json(populatedRequest);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Add document to request
router.post('/:id/documents', auth, async (req, res) => {
    try {
        const { name, url, type } = req.body;
        console.log(`Adding document to request ${req.params.id}:`, { name, url, type });
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Demande non trouvée' });
        }

        // Check if student owns the request
        if (request.student.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        // Check limit (5 docs)
        if (request.documents.length >= 5) {
            return res.status(400).json({ message: 'Limite de 5 documents atteinte' });
        }

        request.documents.push({ name, url, type });

        // Add history entry
        request.history.push({
            action: `Ajout document : ${name}`,
            user: 'Étudiant'
        });

        await request.save();
        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// Delete document from request (Student)
router.delete('/:id/documents/:docId', auth, async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        if (!request) return res.status(404).json({ message: 'Demande non trouvée' });

        if (request.student.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Non autorisé' });
        }

        const docIndex = request.documents.findIndex(d => d._id.toString() === req.params.docId);
        if (docIndex === -1) return res.status(404).json({ message: 'Document non trouvé' });

        const doc = request.documents[docIndex];

        // Only delete from File collection if it's a local file
        if (!doc.url.startsWith('http')) {
            const File = require('../models/File');
            const fileId = doc.url.split('/').pop();
            try {
                await File.findByIdAndDelete(fileId);
            } catch (err) {
                console.error("Erreur suppression fichier DB:", err);
            }
        }

        request.documents.splice(docIndex, 1);
        request.history.push({
            action: `Suppression document : ${doc.name}`,
            user: 'Étudiant'
        });

        await request.save();
        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;
