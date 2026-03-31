# Task Manager API

A small REST API for task tracking: Express, MongoDB, JWT auth. Work happens inside **projects** (teams). Tasks belong to a project; comments can include **file uploads**. Logging out can invalidate the token on the server.

You can drive the whole API from **Postman** using the collection file in this repo (see below)—import it once, then run requests in order without hand-writing URLs or headers.

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

## Postman collection

This repo includes a ready-to-import Postman collection so you can call every endpoint without building requests from scratch.

**Import it**

1. Open [Postman](https://www.postman.com/downloads/).
2. Click **Import** (top left), then choose **`Task Manager API.postman_collection.json`** from the project root, or drag that file into the window.
3. You will see a collection named **Task Manager API** with folders: Auth, Users, Projects, Tasks, Comments, Static files.

**Use it**

1. Start the API locally (`npm run dev`) so `baseUrl` matches (default `http://localhost:3000`; change the **`baseUrl`** collection variable if your port differs).
2. Run **Auth → Register** (optional) then **Auth → Login**. The Login request includes a **Tests** script that stores the JWT in a Postman **environment** variable **`Authorization`**. Create or select an **environment** in Postman (eye icon, top right) so scripts can save variables—then pick that environment before sending requests.
3. After login, run other requests (projects, tasks, comments, etc.). They use `{{Authorization}}` on the `Authorization` header. If something fails with 401, run Login again.
4. **Order matters for `projectId`:** run **Projects → Create project** before tasks that need `{{projectId}}` in the URL or body. Copy the project’s `_id` from the response into the **`projectId`** collection (or environment) variable if the Tests script did not set it—otherwise **Create task** and **Add member** will hit the wrong project or fail.
5. **Collection variables** you can edit by hand: `baseUrl`, `token`, `projectId`, `taskId`. Some requests have tests that copy `projectId` / `taskId` from responses into the environment; if not, paste MongoDB `_id` values from JSON responses yourself.

**Multipart comments:** use **Comments → Add comment (multipart + files)**, body type **form-data**, fields **`text`** (optional) and **`files`** (choose files in Postman).

## Auth

Use `Authorization: Bearer <token>` on protected routes, or send the raw JWT (both work).

Register → login → call the API with the token → logout when done (logout revokes that token server-side until it expires).

Sign-up: name + email required, password **8–128** characters, unique email.

## API overview

Use `Content-Type: application/json` unless you are uploading files.

**Public:** `POST /auth/register`, `POST /auth/login`

**Needs token:** `POST /auth/logout`, profile `GET`/`PATCH /users/profile`, projects (`POST/GET /projects`, `POST /projects/:id/members`, `PUT`/`DELETE /projects/:id`), tasks (`POST/GET /tasks`, `PUT`/`DELETE /tasks/:id`), comments (`POST`/`GET /comments/:taskId`).

### Projects and `projectId`

Everything task-related is scoped to a **project** (team). A task always has a `projectId` in the database.

- **Create a project first** (`POST /projects`) unless you already belong to one. You must be the creator or a **member** of a project to create tasks or comments there.
- **Creating a task** (`POST /tasks`): you can send **`projectId`** in the JSON to pick which project the task belongs to. If you **omit** `projectId`, the API assigns the task to the **first** project you belong to (oldest by id). If you **don’t belong to any project yet**, the request fails with an error—create or join a project first.
- **Assigning tasks:** `assignedTo` must be a user who is already a **member of that project** (owner counts as a member). Random user ids are rejected.
- **Listing tasks** (`GET /tasks`): without `?projectId=...` you see tasks from **all** projects you’re in. Add **`?projectId=<id>`** to narrow to one project. Query params `mine`, `status`, and `search` still apply on top of that.
- **Comments** are on a **task**; access is checked via that task’s project, so you must be a member of the same project.

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
