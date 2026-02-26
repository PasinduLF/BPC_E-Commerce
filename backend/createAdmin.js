const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected ✅');

        const adminExists = await User.findOne({ email: 'admin@beautypc.com' });

        if (adminExists) {
            console.log('Admin user already exists! You can log in with:');
            console.log('Email: admin@beautypc.com');
            console.log('Password: password123');
            process.exit();
        }

        const adminUser = await User.create({
            name: 'P&C Admin',
            email: 'admin@beautypc.com',
            password: 'password123',
            role: 'admin'
        });

        console.log('Admin user created successfully! 🎉');
        console.log('--- LOGIN CREDENTIALS ---');
        console.log('Email: admin@beautypc.com');
        console.log('Password: password123');
        console.log('-------------------------');

        process.exit();
    } catch (error) {
        console.error('Error with database connection or user creation:');
        console.error(error);
        process.exit(1);
    }
};

createAdmin();
