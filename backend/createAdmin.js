const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || 'P&C Admin';

const createAdmin = async () => {
    try {
        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables');
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected ✅');

        const adminExists = await User.findOne({ email: ADMIN_EMAIL });

        if (adminExists) {
            console.log(`Admin user already exists for email: ${ADMIN_EMAIL}`);
            process.exit();
        }

        const adminUser = await User.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            role: 'admin'
        });

        console.log('Admin user created successfully! 🎉');
        console.log(`Admin email: ${adminUser.email}`);

        process.exit();
    } catch (error) {
        console.error('Error with database connection or user creation:');
        console.error(error);
        process.exit(1);
    }
};

createAdmin();
