const SystemConfig = require('../models/SystemConfig');
const cloudinary = require('cloudinary').v2;

// @desc    Get system configuration (public)
// @route   GET /api/config
// @access  Public
const getConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();

        // If no config exists, create a default one
        if (!config) {
            config = await SystemConfig.create({});
        }

        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching system configuration' });
    }
};

// @desc    Update system configuration
// @route   PUT /api/config
// @access  Private/Admin
const updateConfig = async (req, res) => {
    try {
        let config = await SystemConfig.findOne();

        if (!config) {
            config = new SystemConfig();
        }

        config.businessName = req.body.businessName || config.businessName;
        config.currencySymbol = req.body.currencySymbol || config.currencySymbol;

        // Handle numbers explicitly to allow 0
        if (req.body.taxRate !== undefined) config.taxRate = Number(req.body.taxRate);
        if (req.body.shippingFee !== undefined) config.shippingFee = Number(req.body.shippingFee);
        if (req.body.freeShippingThreshold !== undefined) config.freeShippingThreshold = Number(req.body.freeShippingThreshold);
        if (req.body.codDeliveryCharge !== undefined) config.codDeliveryCharge = Number(req.body.codDeliveryCharge);

        if (req.body.bankDetails !== undefined && Array.isArray(req.body.bankDetails)) {
            // Filter out completely empty bank detail rows to prevent Mongoose validation errors
            const validBankDetails = req.body.bankDetails.filter(bank =>
                (bank.bankName && bank.bankName.trim() !== '') ||
                (bank.accountName && bank.accountName.trim() !== '') ||
                (bank.accountNumber && bank.accountNumber.trim() !== '') ||
                (bank.branch && bank.branch.trim() !== '')
            );
            config.bankDetails = validBankDetails;
        }

        if (req.body.contactEmail !== undefined) config.contactEmail = req.body.contactEmail;
        if (req.body.contactPhone !== undefined) config.contactPhone = req.body.contactPhone;

        if (req.body.storefrontAppearance !== undefined) {
            let parsedAppearance = req.body.storefrontAppearance;
            if (typeof parsedAppearance === 'string') {
                try {
                    parsedAppearance = JSON.parse(parsedAppearance);
                } catch (e) {
                    // Ignore JSON parse errors and assume it was parsed by extended body parser
                }
            }

            if (!config.storefrontAppearance) {
                config.storefrontAppearance = {};
            }

            if (parsedAppearance.heroTitle !== undefined) config.storefrontAppearance.heroTitle = parsedAppearance.heroTitle;
            if (parsedAppearance.heroSubtitle !== undefined) config.storefrontAppearance.heroSubtitle = parsedAppearance.heroSubtitle;
            if (parsedAppearance.heroHighlight !== undefined) config.storefrontAppearance.heroHighlight = parsedAppearance.heroHighlight;
        }

        // Handle Hero Image Upload
        if (req.file) {
            // Delete old image from cloudinary if it exists
            if (config.storefrontAppearance && config.storefrontAppearance.heroImage && config.storefrontAppearance.heroImage.public_id) {
                await cloudinary.uploader.destroy(config.storefrontAppearance.heroImage.public_id);
            }

            // Upload the new image
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'beautypnc/config',
            });

            if (!config.storefrontAppearance) {
                config.storefrontAppearance = {};
            }
            config.storefrontAppearance.heroImage = {
                url: result.secure_url,
                public_id: result.public_id,
            };
        }

        const updatedConfig = await config.save();
        res.json(updatedConfig);
    } catch (error) {
        console.error('Config update error:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors).map(err => err.message).join(', ') });
        }
        res.status(500).json({ message: error.message || 'Error updating system configuration' });
    }
};

module.exports = {
    getConfig,
    updateConfig
};
