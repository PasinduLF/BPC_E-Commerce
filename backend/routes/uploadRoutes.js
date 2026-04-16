const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for temporary local storage (before uploading to Cloudinary)
const storage = multer.diskStorage({
    destination(req, file, cb) {
        if (!fs.existsSync('uploads/')) {
            fs.mkdirSync('uploads/');
        }
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter(req, file, cb) {
        const filetypes = /jpe?g|png|webp/;
        const mimetypes = /image\/jpe?g|image\/png|image\/webp/;

        const extname = filetypes.test(file.originalname.toLowerCase());
        const mimetype = mimetypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Images only!'));
        }
    },
});

// Upload route
router.post('/', protect, upload.single('image'), async (req, res) => {
    let processedPath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        let uploadPath = req.file.path;

        // Flatten any transparent image onto white to keep product backgrounds consistent.
        const metadata = await sharp(req.file.path).metadata();
        if (metadata.hasAlpha) {
            const parsed = path.parse(req.file.path);
            processedPath = path.join(parsed.dir, `${parsed.name}-whitebg.jpg`);

            await sharp(req.file.path)
                .flatten({ background: '#ffffff' })
                .jpeg({ quality: 92 })
                .toFile(processedPath);

            uploadPath = processedPath;
        }

        const result = await cloudinary.uploader.upload(uploadPath, {
            folder: 'bpc-ecommerce', // Cloudinary folder name
        });

        // Remove file from local uploads folder
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (processedPath && fs.existsSync(processedPath)) {
            fs.unlinkSync(processedPath);
        }

        res.json({
            message: 'Image uploaded successfully',
            url: result.secure_url,
            public_id: result.public_id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading image to Cloudinary' });

        // Clean up local file even on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        if (processedPath && fs.existsSync(processedPath)) {
            fs.unlinkSync(processedPath);
        }
    }
});

module.exports = router;
