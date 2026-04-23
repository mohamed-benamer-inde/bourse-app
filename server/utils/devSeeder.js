const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Request = require('../models/Request');

const seedDevData = async () => {
    try {
        // Clear existing data in dev/in-memory mode
        await User.deleteMany({ email: { $in: ['donor@test.com', 'student@test.com'] } });
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        // Create Donor
        const donor = new User({
            name: 'Jean Donateur',
            email: 'donor@test.com',
            password: hashedPassword,
            role: 'donor',
            isValidated: true
        });
        await donor.save();

        // Create Student
        const student = new User({
            name: 'Marie Étudiante',
            email: 'student@test.com',
            password: hashedPassword,
            role: 'student',
            isValidated: true,
            studyField: 'Informatique',
            educationLevel: 'Master 1',
            rsuTranche: 'Tranche 1',
            resources: 400,
            description: 'Étudiante motivée ayant besoin d\'aide pour ses frais de scolarité.',
            gradeCurrent: 15
        });
        await student.save();

        // Create a Request in INFO_RECEIVED state
        // To have INFO_RECEIVED, we need a donor assigned
        const request = new Request({
            student: student._id,
            donor: donor._id,
            amountNeeded: 1200,
            status: 'INFO_RECEIVED',
            exchanges: [
                {
                    type: 'MESSAGE',
                    message: 'Pouvez-vous fournir votre dernier relevé de notes ?',
                    from: 'Donateur',
                    date: new Date(Date.now() - 86400000)
                },
                {
                    type: 'RESPONSE',
                    message: 'Bonjour, voici mon relevé en pièce jointe.',
                    from: 'Étudiant',
                    date: new Date(Date.now() - 43200000)
                }
            ],
            history: [
                { action: 'Création du dossier', user: 'Étudiant' },
                { action: 'Prise en charge', user: 'Donateur' },
                { action: 'Demande d\'infos', user: 'Donateur' },
                { action: 'Réponse envoyée', user: 'Étudiant' }
            ]
        });
        await request.save();

        console.log('✅ Development data seeded:');
        console.log('   - Donor: donor@test.com / password123');
        console.log('   - Student: student@test.com / password123');
        console.log('   - Request: 1 (Status: INFO_RECEIVED)');

    } catch (err) {
        console.error('❌ Error seeding dev data:', err);
    }
};

module.exports = seedDevData;
