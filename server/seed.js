require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const email = process.env.SUPERADMIN_EMAIL;
        const password = process.env.SUPERADMIN_PASSWORD;

        if (!email || !password) {
            console.warn('⚠️ SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD not set. Skipping Super Admin creation.');
            process.exit(0);
        }

        let user = await User.findOne({ email });
        if (user) {
            console.log('Super Admin already exists. Updating role to ensure correctness...');
            user.role = 'superadmin';
            user.isValidated = true;
            // Optional: Update password if you want to enforce the env var password
            // const salt = await bcrypt.genSalt(10);
            // user.password = await bcrypt.hash(password, salt);
            await user.save();
            console.log('Super Admin role updated.');
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
