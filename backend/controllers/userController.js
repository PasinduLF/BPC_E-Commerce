const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const cloudinary = require('cloudinary').v2;

// @desc    Auth user & get token
// @route   POST /api/users/auth
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

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

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'User already exists' });
        return;
    }

    const user = await User.create({
        name,
        email,
        password,
    });

    if (user) {
        generateToken(res, user._id);
        res.status(201).json({
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
        res.status(400).json({ message: 'Invalid user data' });
    }
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
    registerUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    getUserById,
    updateUser,
    deleteUser
};