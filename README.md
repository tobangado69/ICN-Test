# Task Manager

A full-stack REST API and web app for managing users and tasks. Users can register, log in with JWT, and perform CRUD operations on tasks they own. Public endpoints allow listing users and tasks without authentication. The frontend provides a minimal UI for login, registration, and task management.

---

## Tech Stack

| Layer        | Technologies                                                                     |
| ------------ | -------------------------------------------------------------------------------- |
| **Backend**  | Node.js, TypeScript, Express, Prisma, PostgreSQL, Zod, JWT, bcrypt, dotenv, cors |
| **Frontend** | React 18, Vite, TypeScript, React Router, Tailwind CSS, Axios                    |

---

## Prerequisites

- **Node.js** 18 or later
- **PostgreSQL** 14 or later
- **npm** (comes with Node.js)

---

## Install & Run

### Step 1: Clone and install dependencies

```bash
git clone https://github.com/tobangado69/ICN-Test.git
cd task-manager-api
npm install
```

### Step 2: Environment variables

```bash
cp .env.example .env
```

Edit `.env` and set:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — At least 32 characters (for token signing)

### Step 3: Database setup

```bash
npx prisma migrate deploy
```

For development (creates migration if schema changed):

```bash
npx prisma migrate dev --name init
```

### Step 4: Run the backend

```bash
npm run dev
```

Backend runs at **http://localhost:3000**.

### Step 5: Run the frontend (optional)

In a **new terminal**:

```bash
cd frontend
npm install
cp .env.example .env   # optional: set VITE_API_URL if backend URL differs
npm run dev
```

Frontend runs at **http://localhost:5173**.

### Production

**Backend:**

```bash
npm run build
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
# Serve dist/ with any static host (e.g. nginx, Vercel, Netlify)
```

---

## Database Setup

### PostgreSQL

1. Install PostgreSQL (https://www.postgresql.org/download/).
2. Create a database:
   ```sql
   CREATE DATABASE task_manager;
   ```
3. Set `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/task_manager"
   ```
4. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### Schema

- **users** — id, name, email, password (hashed), created_at, updated_at
- **tasks** — id, title, description, status, user_id, created_at, updated_at

---

## API Endpoints

### Users

| Method | Path               | Auth | Description              |
| ------ | ------------------ | ---- | ------------------------ |
| POST   | `/users`           | No   | Register a new user      |
| POST   | `/users/login`     | No   | Login, returns JWT token |
| GET    | `/users`           | No   | List all users           |
| GET    | `/users/:id`       | No   | Get user by ID           |
| GET    | `/users/:id/tasks` | No   | Get tasks for a user     |
| PUT    | `/users/:id`       | No   | Update user              |
| DELETE | `/users/:id`       | No   | Delete user              |

### Tasks

| Method | Path              | Auth   | Description                           |
| ------ | ----------------- | ------ | ------------------------------------- |
| POST   | `/tasks`          | Bearer | Create a task                         |
| GET    | `/tasks`          | No     | List all tasks                        |
| GET    | `/tasks/my-tasks` | Bearer | List tasks for the authenticated user |
| GET    | `/tasks/:id`      | No     | Get task by ID                        |
| PUT    | `/tasks/:id`      | Bearer | Update task (owner only)              |
| DELETE | `/tasks/:id`      | Bearer | Delete task (owner only)              |

Protected endpoints require header: `Authorization: Bearer <token>`.

---

## Request / Response Examples

### POST /users — Register

**Request:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T10:00:00.000Z"
}
```

**Error (409 — email already registered):**

```json
{
  "error": "Email already registered"
}
```

---

### POST /users/login — Login

**Request:**

```json
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "createdAt": "2026-03-11T10:00:00.000Z",
    "updatedAt": "2026-03-11T10:00:00.000Z"
  }
}
```

**Error (401):**

```json
{
  "error": "Invalid email or password"
}
```

---

### POST /tasks — Create task (requires Bearer token)

**Request Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Complete project docs",
  "description": "Write README and API documentation",
  "status": "pending"
}
```

**Response (201):**

```json
{
  "id": 1,
  "title": "Complete project docs",
  "description": "Write README and API documentation",
  "status": "pending",
  "userId": 1,
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T10:00:00.000Z"
}
```

**Error (401 — no token):**

```json
{
  "error": "Missing or invalid token"
}
```

---

### PUT /tasks/:id — Update task

**Request:**

```json
{
  "title": "Updated title",
  "status": "completed"
}
```

**Response (200):** Returns the updated task object.

**Error (403 — not owner):**

```json
{
  "error": "You do not have permission to update this task"
}
```

---

### DELETE /tasks/:id

**Response (204):** No content.

---

## Environment Variables

| Variable       | Description                           | Example                                            |
| -------------- | ------------------------------------- | -------------------------------------------------- |
| PORT           | Backend server port                   | 3000                                               |
| DATABASE_URL   | PostgreSQL connection URL             | postgresql://user:pass@localhost:5432/task_manager |
| DB_HOST        | Database host (if used)               | localhost                                          |
| DB_PORT        | Database port                         | 5432                                               |
| DB_NAME        | Database name                         | task_manager                                       |
| DB_USER        | Database user                         | postgres                                           |
| DB_PASSWORD    | Database password                     | your_password                                      |
| JWT_SECRET     | Secret for JWT signing (min 32 chars) | your_secret_min_32_chars                           |
| JWT_EXPIRES_IN | Token expiry                          | 1h                                                 |
| CORS_ORIGIN    | Allowed frontend origin (production)  | https://your-app.vercel.app                        |
| VITE_API_URL   | Backend API URL (frontend only)       | http://localhost:3000                              |

---

## Ports

| Service  | Port | URL                   |
| -------- | ---- | --------------------- |
| Backend  | 3000 | http://localhost:3000 |
| Frontend | 5173 | http://localhost:5173 |

---

## Live URL

_Add your deployment URL here after deploying to Vercel, Netlify, Railway, or similar._

- **Backend (API):** _e.g. https://icn-test-production.up.railway.app (DONE)
- **Frontend:** _e.g. https://icn-test-inky.vercel.app/login (DONE)

---

## Deployment — Option 1: Vercel + Railway/Render

### 1. Backend (Railway or Render)

1. Create a new project and add a **PostgreSQL** database (Railway/Render/Neon/Supabase).
2. Add a **Web Service** that uses this repo:
   - **Root Directory:** `.` (project root)
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
3. Set environment variables:
   - `DATABASE_URL` — use the URL from the PostgreSQL add-on
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — from the connection string or same values as local
   - `JWT_SECRET` — at least 32 characters
4. Deploy and copy the backend URL (e.g. `https://your-api.railway.app`).

### 2. Backend CORS

Set `CORS_ORIGIN` to your frontend URL after Vercel deploys:

```
CORS_ORIGIN=https://your-app.vercel.app
```

### 3. Frontend (Vercel)

1. Connect the repo to Vercel.
2. Project settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist`
3. Add environment variable:
   - `VITE_API_URL` — your backend URL (e.g. `https://your-api.railway.app`)
4. Deploy.

### 4. Update README

Replace the Live URL placeholders above with your deployed URLs.

---

## Project Structure

```
├── src/                    # Backend source
│   ├── config/             # Environment, config
│   ├── lib/                # Prisma client
│   ├── middleware/         # Auth, validation, error handler
│   ├── modules/            # Users, tasks
│   └── server.ts           # Entry point
├── frontend/               # React + Vite app
│   ├── src/
│   │   ├── api/            # Axios client, auth, tasks
│   │   ├── pages/          # Login, Register, Dashboard, TaskForm
│   │   └── context/        # Auth context
│   └── package.json
├── prisma/
│   └── schema.prisma       # Database schema
├── .env.example
└── README.md
```
