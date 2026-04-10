const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');
const { sendEmailSafely } = require('../utils/emailService');

const buildFrontendUrl = (path) => {
    const configuredUrls = String(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);

    const publicUrl = configuredUrls.find((url) => !/localhost|127\.0\.0\.1/i.test(url));
    const base = (process.env.FRONTEND_URL || publicUrl || configuredUrls[0] || 'https://beautypc.vercel.app').replace(/\/$/, '');
    return `${base}${path}`;
};

const buildPublicFrontendUrl = (path) => buildFrontendUrl(path);

const hashToken = (token) =>
    crypto.createHash('sha256').update(String(token)).digest('hex');

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// @desc    Send signup OTP before password setup
// @route   POST /api/users/signup/send-otp
// @access  Public
const sendSignupOtp = async (req, res) => {
    const name = String(req.body.name || '').trim();
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();

    if (!name || !normalizedEmail) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    let user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user && user.emailVerified) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const verificationTokenRaw = crypto.randomBytes(32).toString('hex');
    const verificationOtpRaw = generateOtp();

    if (!user) {
        user = new User({
            name,
            email: normalizedEmail,
            password: crypto.randomBytes(16).toString('hex'),
            emailVerified: false,
        });
    }

    user.name = name;
    user.emailVerificationToken = hashToken(verificationTokenRaw);
    user.emailVerificationExpires = Date.now() + 1000 * 60 * 60 * 24;
    user.emailVerificationOtp = hashToken(verificationOtpRaw);
    user.emailVerificationOtpExpires = Date.now() + 1000 * 60 * 15;
    user.signupOtpVerifiedAt = null;
    await user.save();

    const verifyUrl = buildFrontendUrl(`/verify-email?token=${verificationTokenRaw}&email=${encodeURIComponent(normalizedEmail)}`);
    sendEmailSafely({
        to: user.email,
        templateName: 'verifyEmail',
        data: {
            name: user.name,
            verifyUrl,
            otpCode: verificationOtpRaw,
        },
    });

    res.status(200).json({ message: 'OTP sent to your email.', email: user.email });
};

// @desc    Verify signup OTP before setting password
// @route   POST /api/users/signup/verify-otp
// @access  Public
const verifySignupOtp = async (req, res) => {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();

    if (!normalizedEmail || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({
        email: normalizedEmail,
        emailVerified: false,
        emailVerificationOtp: hashToken(otp),
        emailVerificationOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    user.signupOtpVerifiedAt = new Date();
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();

    res.status(200).json({ message: 'OTP verified. You can now set your password.' });
};

// @desc    Complete signup after OTP verification
// @route   POST /api/users/signup/complete
// @access  Public
const completeSignup = async (req, res) => {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!normalizedEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
        return res.status(404).json({ message: 'Account setup not found. Please send OTP again.' });
    }

    if (user.emailVerified) {
        return res.status(400).json({ message: 'Account is already verified. Please sign in.' });
    }

    if (!user.signupOtpVerifiedAt) {
        return res.status(400).json({ message: 'Please verify OTP before setting password.' });
    }

    user.password = password;
    user.emailVerified = true;
    user.signupOtpVerifiedAt = null;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();

    sendEmailSafely({
        to: user.email,
        templateName: 'registrationSuccess',
        data: { name: user.name },
    });

    res.status(200).json({ message: 'Account created successfully. You can now sign in.' });
};

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (user && !user.emailVerified) {
        return res.status(403).json({
            message: 'Please verify your email before signing in',
            needsEmailVerification: true,
        });
    }

    if (user && (await user.matchPassword(password))) {
        generateToken(res, user._id);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dob: user.dob,
            profileImage: user.profileImage,
            cart: user.cart,
            wishlist: user.wishlist,
            addresses: user.addresses
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const verificationTokenRaw = crypto.randomBytes(32).toString('hex');
    const verificationTokenHashed = hashToken(verificationTokenRaw);
    const verificationOtpRaw = generateOtp();

    const user = await User.create({
        name,
        email: normalizedEmail,
        password,
        emailVerified: false,
        emailVerificationToken: verificationTokenHashed,
        emailVerificationExpires: Date.now() + 1000 * 60 * 60 * 24,
        emailVerificationOtp: hashToken(verificationOtpRaw),
        emailVerificationOtpExpires: Date.now() + 1000 * 60 * 15,
    });

    if (user) {
        const verifyUrl = buildFrontendUrl(`/verify-email?token=${verificationTokenRaw}`);
        sendEmailSafely({
            to: user.email,
            templateName: 'verifyEmail',
            data: {
                name: user.name,
                verifyUrl,
                otpCode: verificationOtpRaw,
            },
        });

        res.status(201).json({
            message: 'Registration successful. Please verify your email to activate your account.',
            needsEmailVerification: true,
            email: user.email,
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Verify user email
// @route   GET /api/users/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    const token = String(req.query.token || '').trim();
    if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();

    sendEmailSafely({
        to: user.email,
        templateName: 'registrationSuccess',
        data: { name: user.name },
    });

    res.json({ message: 'Email verified successfully. You can now sign in.' });
};

// @desc    Verify user email with OTP
// @route   POST /api/users/verify-email/otp
// @access  Public
const verifyEmailWithOtp = async (req, res) => {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();

    if (!normalizedEmail || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({
        email: normalizedEmail,
        emailVerificationOtp: hashToken(otp),
        emailVerificationOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    user.emailVerificationOtp = null;
    user.emailVerificationOtpExpires = null;
    await user.save();

    sendEmailSafely({
        to: user.email,
        templateName: 'registrationSuccess',
        data: { name: user.name },
    });

    res.json({ message: 'Email verified successfully. You can now sign in.' });
};

// @desc    Resend verification email
// @route   POST /api/users/verify-email/resend
// @access  Public
const resendVerificationEmail = async (req, res) => {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        return res.status(200).json({ message: 'If the account exists, a verification email has been sent.' });
    }

    if (user.emailVerified) {
        return res.status(200).json({ message: 'Email is already verified.' });
    }

    const verificationTokenRaw = crypto.randomBytes(32).toString('hex');
    const verificationOtpRaw = generateOtp();
    user.emailVerificationToken = hashToken(verificationTokenRaw);
    user.emailVerificationExpires = Date.now() + 1000 * 60 * 60 * 24;
    user.emailVerificationOtp = hashToken(verificationOtpRaw);
    user.emailVerificationOtpExpires = Date.now() + 1000 * 60 * 15;
    await user.save();

    const verifyUrl = buildFrontendUrl(`/verify-email?token=${verificationTokenRaw}`);
    sendEmailSafely({
        to: user.email,
        templateName: 'verifyEmail',
        data: {
            name: user.name,
            verifyUrl,
            otpCode: verificationOtpRaw,
        },
    });

    res.status(200).json({ message: 'Verification email sent.' });
};

// @desc    Request password reset email
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();

    if (!normalizedEmail) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        return res.status(200).json({ message: 'If the account exists, a reset email has been sent.' });
    }

    const resetTokenRaw = crypto.randomBytes(32).toString('hex');
    const resetOtpRaw = generateOtp();
    user.passwordResetToken = hashToken(resetTokenRaw);
    user.passwordResetExpires = Date.now() + 1000 * 60 * 30;
    user.passwordResetOtp = hashToken(resetOtpRaw);
    user.passwordResetOtpExpires = Date.now() + 1000 * 60 * 15;
    await user.save();

    const resetUrl = buildPublicFrontendUrl(`/reset-password?token=${resetTokenRaw}`);
    sendEmailSafely({
        to: user.email,
        templateName: 'forgotPassword',
        data: {
            name: user.name,
            resetUrl,
            otpCode: resetOtpRaw,
        },
    });

    res.status(200).json({ message: 'If the account exists, a reset email has been sent.' });
};

// @desc    Reset password from token
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const token = String(req.body.token || '').trim();
    const password = String(req.body.password || '');

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
        passwordResetToken: hashToken(token),
        passwordResetExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now sign in.' });
};

// @desc    Reset password from OTP
// @route   POST /api/users/reset-password/otp
// @access  Public
const resetPasswordWithOtp = async (req, res) => {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const otp = String(req.body.otp || '').trim();
    const password = String(req.body.password || '');

    if (!normalizedEmail || !otp || !password) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
        email: normalizedEmail,
        passwordResetOtp: hashToken(otp),
        passwordResetOtpExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP code' });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.passwordResetOtp = null;
    user.passwordResetOtpExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now sign in.' });
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            dob: user.dob,
            profileImage: user.profileImage,
            cart: user.cart,
            wishlist: user.wishlist,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile (including cart & wishlist)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password;
        }

        // Sync cart and wishlist from frontend payload
        if (req.body.cart !== undefined) {
            user.cart = req.body.cart;
        }
        if (req.body.wishlist !== undefined) {
            user.wishlist = req.body.wishlist;
        }
        if (req.body.addresses !== undefined) {
            user.addresses = req.body.addresses;
        }
        if (req.body.phone !== undefined) {
            user.phone = req.body.phone;
        }
        if (req.body.dob !== undefined) {
            user.dob = req.body.dob;
        }

        // Handle Image Upload
        if (req.file) {
            // Delete old image from cloudinary if it exists
            if (user.profileImage && user.profileImage.public_id) {
                await cloudinary.uploader.destroy(user.profileImage.public_id);
            }

            // Upload the new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'beautypnc/users',
            });

            user.profileImage = {
                url: result.secure_url,
                public_id: result.public_id,
            };
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            dob: updatedUser.dob,
            profileImage: updatedUser.profileImage,
            cart: updatedUser.cart,
            wishlist: updatedUser.wishlist,
            addresses: updatedUser.addresses
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    const users = await User.find({});
    res.json(users);
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        if (user.role === 'admin') {
            res.status(400);
            throw new Error('Cannot delete admin user');
        }
        await User.deleteOne({ _id: user._id });
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
};

module.exports = {
    authUser,
    sendSignupOtp,
    verifySignupOtp,
    completeSignup,
    registerUser,
    verifyEmail,
    verifyEmailWithOtp,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    resetPasswordWithOtp,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};