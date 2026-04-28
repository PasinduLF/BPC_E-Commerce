process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.MONGOMS_DOWNLOAD_DIR = 'C:\\Users\\pasin\\Documents\\Project\\BPC E-Commerce\\backend\\.mongodb-binaries';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server-core');
const { app } = require('../index');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const CustomerAccount = require('../models/CustomerAccount');

let replSet;

const createUser = async ({ role = 'user', email = 'user@example.com' } = {}) => User.create({
    name: role === 'admin' ? 'Admin User' : 'Test User',
    email,
    password: 'password123',
    role,
    emailVerified: true,
});

const login = async (email) => {
    const res = await request(app)
        .post('/api/users/auth')
        .send({ email, password: 'password123' })
        .expect(200);

    return res.headers['set-cookie'];
};

const createProduct = async (adminId) => {
    const category = await Category.create({ name: 'Skin Care' });
    return Product.create({
        user: adminId,
        name: 'Cleanser',
        description: 'Gentle cleanser',
        price: 100,
        costPrice: 60,
        images: [{ public_id: 'p1', url: 'https://example.com/p1.jpg' }],
        category: category._id,
        stock: 5,
    });
};

beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { storageEngine: 'wiredTiger' } });
    await mongoose.connect(replSet.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    if (replSet) {
        await replSet.stop();
    }
});

beforeEach(async () => {
    await Promise.all([
        User.deleteMany({}),
        Product.deleteMany({}),
        Category.deleteMany({}),
        Order.deleteMany({}),
        CustomerAccount.deleteMany({}),
        mongoose.connection.collection('counters').deleteMany({}),
    ]);
});

test('authenticates verified users and rejects invalid credentials', async () => {
    await createUser();

    await request(app)
        .post('/api/users/auth')
        .send({ email: 'user@example.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
            expect(res.body.email).toBe('user@example.com');
            expect(res.headers['set-cookie']).toBeDefined();
        });

    await request(app)
        .post('/api/users/auth')
        .send({ email: 'user@example.com', password: 'wrong-password' })
        .expect(401);
});

test('protects admin product creation from normal users', async () => {
    await createUser();
    const cookie = await login('user@example.com');

    await request(app)
        .post('/api/products')
        .set('Cookie', cookie)
        .send({ name: 'Blocked' })
        .expect(401);
});

test('lists active products publicly', async () => {
    const admin = await createUser({ role: 'admin', email: 'admin@example.com' });
    await createProduct(admin._id);

    await request(app)
        .get('/api/products')
        .expect(200)
        .expect((res) => {
            expect(res.body.products).toHaveLength(1);
            expect(res.body.products[0].name).toBe('Cleanser');
        });
});

test('creates customer order and deducts stock transactionally', async () => {
    const admin = await createUser({ role: 'admin', email: 'admin@example.com' });
    await createUser();
    const cookie = await login('user@example.com');
    const product = await createProduct(admin._id);

    await request(app)
        .post('/api/orders')
        .set('Cookie', cookie)
        .send({
            orderItems: [{ product: product._id.toString(), qty: 2 }],
            shippingAddress: {
                name: 'Test User',
                address: '123 Main Street',
                city: 'Colombo',
                postalCode: '10000',
                country: 'Sri Lanka',
                phone: '0710000000',
            },
            paymentMethod: 'Cash on Delivery',
            shippingPrice: 10,
            fulfillmentType: 'delivery',
        })
        .expect(201);

    const updatedProduct = await Product.findById(product._id);
    expect(updatedProduct.stock).toBe(3);
    expect(await Order.countDocuments()).toBe(1);
});

test('creates POS credit order and customer account ledger', async () => {
    const admin = await createUser({ role: 'admin', email: 'admin@example.com' });
    const cookie = await login('admin@example.com');
    const product = await createProduct(admin._id);

    await request(app)
        .post('/api/pos')
        .set('Cookie', cookie)
        .send({
            orderItems: [{ product: product._id.toString(), qty: 1 }],
            paymentMethod: 'Credit',
            customerName: 'Walk In',
            customerPhone: '0711111111',
            cashGiven: 40,
        })
        .expect(201)
        .expect((res) => {
            expect(res.body.customerAccount.outstandingBalance).toBe(60);
        });

    const account = await CustomerAccount.findOne({ customerPhone: '0711111111' });
    expect(account.ledger.some((entry) => entry.type === 'outstanding-added')).toBe(true);
});
