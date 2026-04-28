const rateLimit = require('express-rate-limit');

const createLimiter = ({ windowMs, max, message }) => rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
});

const authLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts. Please try again later.',
});

const otpLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many verification attempts. Please try again later.',
});

const uploadLimiter = createLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: 'Too many uploads. Please try again later.',
});

const searchLimiter = createLimiter({
    windowMs: 60 * 1000,
    max: 120,
    message: 'Too many product requests. Please slow down.',
});

module.exports = {
    authLimiter,
    otpLimiter,
    uploadLimiter,
    searchLimiter,
};
