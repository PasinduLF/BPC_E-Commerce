# BPC E-Commerce

> **Version:** 1.0.0  
> **Status:** Production Ready  
> **Last Updated:** April 2026

## 🚀 Project Overview

**BPC E-Commerce** is a comprehensive, full-stack online shopping platform built with modern web technologies. The system features a dual-interface architecture supporting both **Retail (B2C)** and **Wholesale (B2B)** customers, managed through a unified administrative dashboard.

## ✨ Key Features

### 🛍️ Customer-Facing Features
- **Dual Shopping Experience**:
  - **Retail Mode**: Standard e-commerce with individual pricing.
  - **Wholesale Mode**: Tiered pricing, bulk discounts, and credit limits.
- **Product Discovery**:
  - Advanced search with filters (category, brand, price, stock).
  - Sorting options (newest, price low-high, price high-low).
  - Featured products and brand showcases.
- **User Accounts**:
  - Secure authentication (JWT).
  - Order history and tracking.
  - Profile management with address book.
- **Shopping Cart & Checkout**:
  - Persistent cart across sessions.
  - Multiple payment gateway integrations.
  - Order confirmation and email notifications.

### 🛡️ Admin & Management Features
- **Dashboard Analytics**:
  - Real-time sales metrics.
  - Inventory overview.
  - Financial summaries.
- **Product Management**:
  - CRUD operations for products and categories.
  - Image management and SEO optimization.
- **Order Management**:
  - Order tracking and status updates.
  - Customer management.
- **Financial Management**:
  - Transaction tracking.
  - Balance management for wholesale accounts.
- **System Configuration**:
  - Store settings and branding.
  - Payment gateway configuration.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Context API
- **Routing**: React Router DOM

### Backend
- **Framework**: Node.js
- **Runtime**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Bcrypt.js
- **Email**: Nodemailer

## 📂 Project Structure

```
BPC_E-Commerce/
├── backend/                # Express.js API Server
│   ├── config/             # Database and environment config
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Auth, error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API endpoints
│   └── server.js           # Application entry point
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── context/        # Global state
│   │   └── App.jsx         # Main application
│   └── package.json
└── package.json            # Root dependencies
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)

### 1. Backend Setup
```bash
cd backend
npm install

# Create .env file based on .env.example
cp .env.example .env

# Configure environment variables in .env
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_secret_key
# PORT=5000
# FRONTEND_URL=http://localhost:5173
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=mailer@example.com
# SMTP_PASS=your_smtp_password
# SMTP_FROM_EMAIL=mailer@example.com
# SMTP_FROM_NAME=Beauty P&C
# ADMIN_NOTIFICATION_EMAIL=admin@example.com

npm start
```

The API will be available at `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install

# Configure API URL in .env
# VITE_API_URL=http://localhost:5000

npm run dev
```

The application will be available at `http://localhost:5173`.

## 🔑 Default Credentials

### Admin User
- **Email**: [EMAIL_ADDRESS]`
- **Password**: `admin123`

### Retail User
- **Email**: [EMAIL_ADDRESS]`
- **Password**: `user123`

## 📊 Database Models

The system uses the following core MongoDB models:
- **User**: Customer and admin accounts.
- **Product**: Items for sale.
- **Category**: Product categories.
- **Brand**: Product brands.
- **Order**: Customer orders.
- **Transaction**: Financial transactions.
- **Config**: System settings.

## 🔌 API Endpoints

### Authentication
- `POST /api/users/auth` - Login
- `POST /api/users` - Register (sends verification email)
- `GET /api/users/verify-email?token=...` - Verify email
- `POST /api/users/verify-email/resend` - Resend verification email
- `POST /api/users/forgot-password` - Request password reset
- `POST /api/users/reset-password` - Reset password from token

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/myorders` - Get user orders

### Admin
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `GET /api/admin/products` - Manage products

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📞 Support

For issues or questions, please contact the development team.