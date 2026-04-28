const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

dotenv.config();

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const wholesaleRoutes = require('./routes/wholesaleRoutes');

const app = express();

const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '');
const allowedOrigins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => normalizeOrigin(origin.trim()))
    .filter(Boolean);

const connectDB = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is required');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully');
};

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const normalizedRequestOrigin = normalizeOrigin(origin);
        const isAllowed = allowedOrigins.includes(normalizedRequestOrigin);

        if (isAllowed) return callback(null, true);
        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
}));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/wholesale', wholesaleRoutes);
app.use('/api/pos', require('./routes/posRoutes'));
app.use('/api/financials', require('./routes/financialRoutes'));
app.use('/api/brands', require('./routes/brandRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));
app.use('/api/config', require('./routes/configRoutes'));
app.use('/api/bundles', require('./routes/bundleRoutes'));

app.get('/', (req, res) => {
    res.send('Beauty P&C API is running...');
});

app.get('/health', (req, res) => {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
        status: 'ok',
        database: states[mongoose.connection.readyState] || 'unknown',
        uptime: process.uptime(),
    });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
let server;

if (require.main === module) {
    connectDB()
        .then(() => {
            server = app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err);
            process.exit(1);
        });
}

module.exports = { app, connectDB, server };
