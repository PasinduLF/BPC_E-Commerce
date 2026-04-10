const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/auth', authUser);
router.post('/signup/send-otp', sendSignupOtp);
router.post('/signup/verify-otp', verifySignupOtp);
router.post('/signup/complete', completeSignup);
router.get('/verify-email', verifyEmail);
router.post('/verify-email/otp', verifyEmailWithOtp);
router.post('/verify-email/resend', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password/otp', resetPasswordWithOtp);
router.post('/logout', logoutUser);
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, upload.single('profileImage'), updateUserProfile);
router
    .route('/:id')
    .delete(protect, admin, deleteUser)
    .get(protect, admin, getUserById)
    .put(protect, admin, updateUser);

module.exports = router;
