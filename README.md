# Task Manager API

A small **Express + MongoDB** backend for a task manager app. Right now it’s focused on **user auth** (sign up and log in). Task CRUD and file uploads are planned for the folder layout you already have (`routes/`, `services/`, `uploads/`, etc.).

---

## What works today

- **Register** — create a user with hashed password (bcrypt).
- **Login** — returns a **JWT** if email and password match.
- **MongoDB** — the server connects on startup; it won’t listen until the database connection succeeds.

There is an **`authMiddleware`** that verifies a JWT, but it is **not wired to any route yet**. You’ll use it when you add protected endpoints (e.g. “my tasks”).

---

## Prerequisites

- **Node.js** 18 or newer  
- **MongoDB** running locally (e.g. `localhost:27017`) or a cloud URI (Atlas)

---

## Setup

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Create a **`.env`** file in the project root (it’s gitignored). Example for a local database named `TaskManager`:

   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/TaskManager
   JWT_SECRET=your-long-random-secret-at-least-32-chars
   ```

   Use your real Mongo URI if you use Atlas or a different host/port. **`JWT_SECRET`** is used to sign and verify JWTs (login + `authMiddleware`); use a long random string and never commit it. For production, generate one (e.g. `openssl rand -base64 32`).

3. Start the API:

   ```bash
   npm run dev
   ```

   Or without auto-restart on file changes:

   ```bash
   npm start
   ```

   You should see the server URL in the terminal once MongoDB is connected.

---

## API (current)

Base URL: `http://localhost:<PORT>` (default port **3000**).

| Method | Path | Body (JSON) | Notes |
|--------|------|-------------|--------|
| `GET` | `/` | — | Simple health-style response (`{ ok: true }`). |
| `POST` | `/auth/register` | `{ "name", "email", "password" }` | Creates user; **201** with user data on success. |
| `POST` | `/auth/login` | `{ "email", "password" }` | Returns `{ message, token }` on success. |

Send JSON with header: **`Content-Type: application/json`**.

---

## Project layout

```
├── config/          # Shared config (loads .env: port, Mongo URI, JWT secret, uploads path)
├── src/
│   ├── app.js       # Express app, Mongo connect, server listen
│   ├── controllers/
│   ├── middleware/  # JWT middleware (ready for future protected routes)
│   ├── models/      # User schema
│   ├── routes/      # Auth routes
│   ├── services/
│   └── utils/
├── uploads/         # For future attachments
├── .env             # Your secrets (not committed)
└── package.json
```
