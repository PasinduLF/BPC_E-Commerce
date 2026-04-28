# BPC E-Commerce

Full-stack e-commerce, admin, POS, inventory, and financial-management system for Beauty P&C.

## Status

Production-readiness hardening is in progress. The app builds successfully, frontend lint has no blocking errors, and the backend now includes validation, rate limits, transactional order/POS writes, and integration-test scaffolding.

## Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- Zustand
- React Router
- Sonner notifications
- Lucide icons

### Backend
- Node.js
- Express 5
- MongoDB with Mongoose
- JWT cookie authentication
- Cloudinary image uploads
- Nodemailer email notifications
- Zod request validation
- Express rate limiting
- Jest/Supertest integration-test setup

## Project Structure

```text
backend/
  controllers/      Express request handlers
  middleware/       Auth, upload, validation, rate-limit, error handling
  models/           Mongoose models
  routes/           API route modules
  tests/            Backend integration tests
  validation/       Zod schemas
  index.js          Backend app entry point

frontend/
  src/components/   Shared UI components
  src/context/      Zustand stores and theme context
  src/pages/        Customer and admin pages
  src/utils/        UI/domain helpers
```

## Setup

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Required environment variables are documented in `backend/.env.example`. Use strong production secrets and rotate any secret that was previously committed.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_URL` in `frontend/.env`.

## Scripts

### Backend
- `npm start` - run `index.js`
- `npm run dev` - run with Nodemon
- `npm test` - run Jest integration tests

### Frontend
- `npm run dev` - Vite dev server
- `npm run lint` - ESLint
- `npm run build` - production build
- `npm run preview` - preview production build

## Important Production Notes

- Do not commit `.env`, `node_modules`, `dist`, uploads, logs, or generated reports.
- MongoDB transactions require a replica set or Atlas cluster.
- Backend tests use `mongodb-memory-server-core`; the first test run may need network access to download a MongoDB binary.
- No default production credentials are provided. Create admin users through a secure operational process.
