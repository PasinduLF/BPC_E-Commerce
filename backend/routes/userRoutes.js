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
const validate = require('../middleware/validateMiddleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimitMiddleware');
const {
    authUserSchema,
    registerUserSchema,
    emailSchema,
    signupOtpSchema,
    verifyOtpSchema,
    completeSignupSchema,
    resetPasswordSchema,
    resetPasswordOtpSchema,
} = require('../validation/schemas');

router.route('/').post(authLimiter, validate(registerUserSchema), registerUser).get(protect, admin, getUsers);
router.post('/auth', authLimiter, validate(authUserSchema), authUser);
router.post('/signup/send-otp', otpLimiter, validate(signupOtpSchema), sendSignupOtp);
router.post('/signup/verify-otp', otpLimiter, validate(verifyOtpSchema), verifySignupOtp);
router.post('/signup/complete', otpLimiter, validate(completeSignupSchema), completeSignup);
router.get('/verify-email', verifyEmail);
router.post('/verify-email/otp', otpLimiter, validate(verifyOtpSchema), verifyEmailWithOtp);
router.post('/verify-email/resend', otpLimiter, validate(emailSchema), resendVerificationEmail);
router.post('/forgot-password', otpLimiter, validate(emailSchema), forgotPassword);
router.post('/reset-password', otpLimiter, validate(resetPasswordSchema), resetPassword);
router.post('/reset-password/otp', otpLimiter, validate(resetPasswordOtpSchema), resetPasswordWithOtp);
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
