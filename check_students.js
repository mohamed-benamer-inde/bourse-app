require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./server/models/User');

const checkStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bourse_app');
        console.log('Connected to MongoDB');

        const students = await User.find({ role: 'student' })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('name email role isValidated transcriptStatus phone address rsuScore');

        console.log('--- DERNIERS ÉTUDIANTS INSCRITS ---');
        students.forEach(s => {
            console.log(`\nNom: ${s.name}`);
            console.log(`Email: ${s.email}`);
            console.log(`Role: ${s.role}`);
            console.log(`Validé: ${s.isValidated}`);
            console.log(`Statut Relevé: ${s.transcriptStatus}`);
            console.log(`Téléphone: ${s.phone || 'NON DÉFINI'}`);
            console.log(`Score RSU: ${s.rsuScore || 'NON DÉFINI'}`);
            console.log('-----------------------------------');
        });

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkStudents();
