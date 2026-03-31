# Task Manager API

A small REST API for task tracking: Express, MongoDB, JWT auth. Work happens inside **projects** (teams). Tasks belong to a project; comments can include **file uploads**. Logging out can invalidate the token on the server.

You will need **Node 18+** and **MongoDB** (local or Atlas).

## Run it locally

```bash
npm install
```

Create a `.env` in the project root:

```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/TaskManager
JWT_SECRET=replace-with-a-long-random-string
```

`JWT_SECRET` signs the JWTs—use something long and random (e.g. `openssl rand -base64 32`). `PORT` defaults to 3000 if you skip it.

```bash
npm run dev
```

Server: `http://localhost:3000` (or your `PORT`).

## Postman

Import **`Task Manager API.postman_collection.json`** from the project root (File → Import, or drag the file).

The Login request has a small **Tests** script that saves the JWT into a Postman **environment** variable `Authorization`. Create/select an environment in Postman so those scripts can run; other requests use `{{Authorization}}` on the header. You can also paste the token into collection variables **`token`** / **`Authorization`** by hand if you prefer.

**Collection variables:** `baseUrl` (default `http://localhost:3000`), `token`, `projectId`, `taskId`. Create project / create task requests may auto-fill `projectId` and `taskId` into the environment if your scripts are set up that way—otherwise copy `_id` values from responses.

Multipart comments: **form-data**, fields **`text`** (optional) and **`files`**.

## Auth

Use `Authorization: Bearer <token>` on protected routes, or send the raw JWT (both work).

Register → login → call the API with the token → logout when done (logout revokes that token server-side until it expires).

Sign-up: name + email required, password **8–128** characters, unique email.

## API overview

Use `Content-Type: application/json` unless you are uploading files.

**Public:** `POST /auth/register`, `POST /auth/login`

**Needs token:** `POST /auth/logout`, profile `GET`/`PATCH /users/profile`, projects (`POST/GET /projects`, `POST /projects/:id/members`, `PUT`/`DELETE /projects/:id`), tasks (`POST/GET /tasks`, `PUT`/`DELETE /tasks/:id`), comments (`POST`/`GET /comments/:taskId`).

Tasks need a **project**. You can pass `projectId` on create or omit it—the API picks your first project. **assignedTo** must be someone in that project. **GET /tasks** supports `projectId`, `mine`, `status`, `search`.

Comments: JSON body `{ "text" }` or multipart with **`files`** (and optional `text`). Up to 10 files, 5MB each; images, PDF, or plain text. Files are available at `/uploads/<filename>` (public URL).

## cURL

```bash
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password12"}'

curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"password12"}'

curl -s -X POST http://localhost:3000/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Sprint 1","description":"Q1"}'

curl -s -X POST http://localhost:3000/tasks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Fix bug","projectId":"PROJECT_ID"}'

curl -s "http://localhost:3000/tasks?mine=true&status=open" \
  -H "Authorization: Bearer TOKEN"

curl -s -X POST http://localhost:3000/comments/TASK_ID \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"LGTM"}'
```

## Project layout

```
config/
uploads/
Task Manager API.postman_collection.json
src/
  app.js
  controllers/
  models/
  routes/
  middleware/
  utils/
.env
package.json
```

Passwords are hashed with bcrypt; JWTs last about a day. Use HTTPS and a strong `JWT_SECRET` in production. Upload URLs are public to anyone who has the link.
