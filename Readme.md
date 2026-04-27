# TripNetwork

TripNetwork is a full-stack travel platform that brings together **flight search**, **hotels**, **travel packages**, **bookings**, **payments**, and **real-time features** (Socket.IO) in one application.

It consists of:
- **Frontend**: React + Vite + Tailwind CSS (in `frontend/`)
- **Backend**: Node.js + Express (root app)
- **Database**: SQL database via **Sequelize ORM** (configured through environment variables)

---

## Tech Stack

### Frontend
- **React** (SPA)
- **Vite** (dev server + build)
- **Tailwind CSS**
- **React Router**
- **Axios**
- **Socket.IO Client**

### Backend
- **Node.js**
- **Express.js**
- **Sequelize** (ORM)
- **JWT Authentication**
- **EJS** (server-side views are configured; SPA is served in production)
- **Socket.IO** (real-time features)

### Database
- **Sequelize** connects to a SQL database using:
  - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

> Note: The exact SQL engine (MySQL/PostgreSQL/etc.) depends on your Sequelize configuration and installed DB driver.

---

## Repository Structure (High Level)

- `app.js` — Express app entry (routes, middleware, static serving, SPA fallback)
- `routes/` — API route modules (auth, flights, hotels, bookings, etc.)
- `controllers/` — Request handlers / controller logic
- `models/` — Sequelize models + DB initialization
- `middleware/` — Auth, validation, and other middleware
- `services/` — Integrations / service layer
- `socket/` — Real-time socket-related logic
- `views/` — EJS templates (server-rendered pages / error views)
- `public/` — Static assets + uploads
- `frontend/` — React (Vite) client

---

## Key Features

- **Authentication & Authorization**
  - JWT-based auth
  - Admin support (dev bootstrap available)

- **Travel Modules**
  - Flights API endpoints (`/api/flights`)
  - Hotels API endpoints (`/api/hotels`)
  - Packages API endpoints (`/api/packages`)
  - Bookings API endpoints (`/api/bookings`)
  - Custom trip requests (`/api/custom-requests`)

- **Payments**
  - Payment API endpoints (`/api/payment`)
  - SSLCOMMERZ environment variables present for payment configuration

- **AI / Recommendations**
  - AI routes: `/api/ai`
  - Recommendations: `/api/recommendations`
  - `GROQ_API_KEY` supported via environment variables

- **Notifications**
  - `/api/notifications`

- **Chat / Real-time**
  - `/api/chat`
  - Socket.IO support for real-time features

---

## Prerequisites

- **Node.js** (recommended: latest LTS)
- **npm**
- A running **SQL database** accessible from your machine/server (for Sequelize)

---

## Environment Variables

Create a `.env` file in the repository root (you can start from `.env.example`):

```bash
cp .env.example .env
```

### `.env` (required / common)

Backend + security:
- `NODE_ENV` (e.g. `development` / `production`)
- `PORT` (e.g. `3000`)
- `JWT_SECRET` (required in production)
- `JWT_EXPIRES_IN` (e.g. `7d`)

Database (Sequelize):
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Base URLs:
- `APP_BASE_URL`
- `FRONTEND_BASE_URL`

Email (SMTP):
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`

External / integrations (as needed):
- `FlightAPI_KEY`
- `Store_ID`
- `Store_Secret_Key`
- `SSLCOMMERZ_LIVE`
- `GROQ_API_KEY`

> Dev convenience: the server can create a development admin user using `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD` if supported by your environment (defaults exist in code).

---

## Installation

### 1) Install backend dependencies (root)

```bash
npm install
```

### 2) Install frontend dependencies

```bash
cd frontend
npm install
```

---

## Running the Project (Development)

### Start backend

From the repository root:

```bash
npm start
```

(or use your configured script if different)

The backend serves API routes under:

- `http://localhost:<PORT>/api/...`

### Start frontend (Vite dev server)

In another terminal:

```bash
cd frontend
npm run dev
```

Vite will print the local dev URL (commonly `http://localhost:5173`).

> In development, frontend and backend typically run on different ports. Configure your frontend API base URL accordingly (commonly via Vite env variables or a config file in the frontend).

---

## Production Build (Serve React from Express)

This backend is set up to serve the compiled frontend from `frontend/dist`:

1) Build frontend:
```bash
cd frontend
npm run build
```

2) Run backend (from root):
```bash
cd ..
npm start
```

Then open:
- `http://localhost:<PORT>`

The server includes an SPA fallback so client-side routes won’t 404.

---

## API Overview (Main Routes)

The Express app mounts the following (non-exhaustive):

- `POST/GET /api/auth`
- `/api/users`
- `/api/admin`
- `/api/flights`
- `/api/hotels`
- `/api/packages`
- `/api/bookings`
- `/api/payment`
- `/api/custom-requests`
- `/api/chat`
- `/api/ai`
- `/api/recommendations`
- `/api/notifications`

---

## Database & Sequelize Notes

- The app verifies the DB connection on startup via Sequelize.
- In **development**, the server may run a schema sync:
  - `sequelize.sync({ alter: true })`

> For production, you typically want migrations instead of `alter: true`.

---

## Security Notes

- **Do not** run production without setting `JWT_SECRET`.
- Keep `.env` out of version control.
- Ensure proper CORS / cookie / secure headers configuration for deployment (depending on your frontend hosting setup).

---