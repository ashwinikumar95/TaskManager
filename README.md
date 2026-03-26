# Task Manager API

An **Express + MongoDB (Mongoose)** REST API for managing **users**, **tasks**, and **comments** on those tasks. Auth uses **JWT**; tasks and comments are behind middleware so only requests with a valid token can hit those routes.

**Still optional / not wired:** the `uploads/` folder is there for future file attachments.

---

## What works today

- **Auth** — register, login; passwords hashed with **bcrypt**; login returns a **JWT**.
- **Tasks** — create, list (with optional filters), update, delete — all require a JWT.
- **Comments** — add a comment on a task, list comments for a task — both require a JWT.
- **Profile** — get and update your own user (`name` / `email` only on update; password is not changed via profile).
- **MongoDB** — connects on startup; the HTTP server starts only after a successful connection.

---

## Prerequisites

- **Node.js** 18 or newer  
- **MongoDB** (local, e.g. `127.0.0.1:27017`, or **Atlas**)

---

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Add a **`.env`** file at the project root (gitignored). Example for a local DB named `TaskManager`:

   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/TaskManager
   JWT_SECRET=your-long-random-secret-at-least-32-chars
   ```

   Use your real URI for Atlas or other hosts. **`JWT_SECRET`** signs and verifies JWTs — use a long random value; for production, e.g. `openssl rand -base64 32`.

3. Run the server:

   ```bash
   npm run dev
   ```

   Or:

   ```bash
   npm start
   ```

---

## Authentication

1. **`POST /auth/register`** then **`POST /auth/login`** with `Content-Type: application/json`.
2. Copy the **`token`** from the login response.
3. For protected routes, send header **`Authorization`** with **only the JWT string** (no `Bearer ` prefix), unless you change the middleware to strip `Bearer `.

If Postman/Insomnia uses **Bearer Token** auth, they usually send `Bearer <jwt>`; that can make verification fail with the current middleware. Use a raw **Authorization** header value equal to the token, or adjust the middleware.

---

## API reference

Base URL: `http://localhost:<PORT>` (default **3000**).  
Unless noted, JSON bodies need **`Content-Type: application/json`**.

### Public

| Method | Path | Body | Notes |
|--------|------|------|--------|
| `POST` | `/auth/register` | `{ "name", "email", "password" }` | **201** with user on success. |
| `POST` | `/auth/login` | `{ "email", "password" }` | `{ message, token }` on success. |

### Users / profile (JWT required)

| Method | Path | Body | Notes |
|--------|------|------|--------|
| `GET` | `/users/profile` | — | Current user; password omitted. |
| `PATCH` | `/users/profile` | `{ "name"?, "email"? }` | At least one field required. Validates schema; duplicate email → **400**. |

### Tasks (JWT required)

| Method | Path | Body / query | Notes |
|--------|------|----------------|--------|
| `POST` | `/tasks/` | `{ "title"` (required), `"description"`, `"dueDate"`, `"assignedTo"` (User ObjectId) `}` | `createdBy` is set from the JWT user. |
| `GET` | `/tasks/` | Query: `status` (`open` \| `in-progress` \| `completed`), `search` (matches title/description, case-insensitive) | Lists tasks; `assignedTo` populated with `name`, `email`. |
| `PUT` | `/tasks/:id` | Any updatable task fields | e.g. `status`, `title`, `description`, `dueDate`. |
| `DELETE` | `/tasks/:id` | — | Deletes the task. |

### Comments (JWT required)

| Method | Path | Body | Notes |
|--------|------|------|--------|
| `POST` | `/comments/:taskId` | `{ "text" }` | **201**; `userId` from JWT, `taskId` from URL. |
| `GET` | `/comments/:taskId` | — | Comments for that task; `userId` populated with `name`. |

---

## Data model (short)

- **User** — `name`, `email`, `password` (hashed).  
- **Task** — `title`, `description`, `status` (`open` \| `in-progress` \| `completed`), `dueDate`, `assignedTo`, `createdBy`, timestamps.  
- **Comment** — `text`, `userId`, `taskId`, timestamps.

---

## Project layout

```
├── config/              # Loads .env; exports port, Mongo URI, JWT secret, uploads path
├── src/
│   ├── app.js           # Express app, routes, Mongo connect, listen
│   ├── controllers/     # auth, task, comment handlers
│   ├── middleware/      # JWT auth for /tasks and /comments
│   ├── models/          # User, Task, Comment
│   ├── routes/          # authRoutes, taskRoutes, commentRoutes
│   ├── services/
│   └── utils/
├── uploads/             # Reserved for future attachments
├── .env
└── package.json
```
