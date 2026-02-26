const express = require('express');
const router = express.Router();
const { createPOSOrder } = require('../controllers/posController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, admin, createPOSOrder);

module.exports = router;
