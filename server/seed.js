require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const email = process.env.SUPERADMIN_EMAIL || 'superadmin@bourse.com';
        const password = process.env.SUPERADMIN_PASSWORD || 'superadmin123';

        let user = await User.findOne({ email });
        if (user) {
            console.log('Super Admin already exists');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name: 'Super Admin',
            email,
            password: hashedPassword,
            role: 'superadmin',
            isValidated: true
        });

        await user.save();
        console.log(`Super Admin created: ${email} / ${password}`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedSuperAdmin();
