const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a brand name'],
        unique: true,
        trim: true,
    },
    description: String,
    image: String, // Cloudinary URL (Optional)
}, {
    timestamps: true
});

module.exports = mongoose.model('Brand', brandSchema);
