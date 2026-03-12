# Product Requirement Document: Task Manager API

**Version:** 1.0
**Date:** March 11, 2026
**Status:** Draft
**Author:** Product & Architecture Team
**Type:** Backend Technical Assessment

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals](#2-goals)
3. [Non-Goals](#3-non-goals)
4. [Target Users](#4-target-users)
5. [User Stories](#5-user-stories)
6. [Functional Requirements](#6-functional-requirements)
7. [API Feature Requirements](#7-api-feature-requirements)
8. [Data Model Overview](#8-data-model-overview)
9. [UX Flow (API Usage Flow)](#9-ux-flow-api-usage-flow)
10. [Validation Rules](#10-validation-rules)
11. [Error Handling Expectations](#11-error-handling-expectations)
12. [Security Considerations](#12-security-considerations)
13. [Acceptance Criteria](#13-acceptance-criteria)
14. [Success Metrics](#14-success-metrics)

---

## Related Documents

| Document | Description |
|----------|-------------|
| [FRONTEND-REQUIREMENTS.md](./FRONTEND-REQUIREMENTS.md) | Minimal frontend pages, features, and tech notes |
| [SUBMISSION-REQUIREMENTS.md](./SUBMISSION-REQUIREMENTS.md) | GitHub, README, deployment, and .gitignore checklist |

---

## 1. Product Overview

Task Manager API is a RESTful backend service that enables teams to manage daily tasks. It provides user registration, authentication, and full CRUD operations on tasks scoped to individual users.

This project serves as a **technical assessment for junior full-stack developers**, evaluating their ability to build a structured, secure, and well-documented API and a minimal frontend using Node.js, TypeScript, Express.js, PostgreSQL, and a simple client UI.

**Related documents:**
- [Frontend Requirements](./FRONTEND-REQUIREMENTS.md) — Pages, features, and tech notes for the client
- [Submission Requirements](./SUBMISSION-REQUIREMENTS.md) — GitHub, README, deployment checklist

---

## 2. Goals

| # | Goal |
|---|------|
| G1 | Deliver a functional REST API that supports user registration, authentication, and task management. |
| G2 | Demonstrate proper relational database design with a one-to-many relationship between Users and Tasks. |
| G3 | Enforce input validation and return consistent, meaningful error responses across all endpoints. |
| G4 | Implement token-based authentication that restricts write operations on tasks to authenticated users. |
| G5 | Produce a codebase that is clean, well-organized, and documented in a public GitHub repository with a complete README. |
| G6 | Use environment variables for all configuration — no hardcoded secrets or connection strings. |
| G7 | Deliver a minimal frontend (login/register, task list, create/edit task form) that consumes the API. |

---

## 3. Non-Goals

The following are explicitly **out of scope** for this project:

- **Complex Frontend** — A minimal UI is required (see [Frontend Requirements](./FRONTEND-REQUIREMENTS.md)); advanced SPAs, animations, or design systems are not.
- **Role-based access control (RBAC)** — No admin/manager/member roles. All authenticated users have equal permissions on their own resources.
- **Real-time features** — No WebSockets, SSE, or push notifications.
- **File uploads** — No attachments on tasks.
- **Email verification or password reset flows.**
- **Rate limiting or advanced API gateway features.**
- **Deployment or CI/CD pipeline setup** — Optional; a live URL (Vercel/Netlify) is required for submission (see [Submission Requirements](./SUBMISSION-REQUIREMENTS.md)).
- **Pagination, sorting, or filtering** — Not required, though candidates may implement them as enhancements.
- **Containerization (Docker)** — Not required.

---

## 4. Target Users

### 4.1 Primary: Evaluators (Hiring Team)

Technical reviewers assessing the candidate's backend development skills. They will clone the repository, follow the README, run the project locally, and test endpoints manually or via tools like Postman/Insomnia.

### 4.2 Secondary: The Candidate (Junior Backend Developer)

The developer building the project. The PRD serves as their specification. They should be able to implement the full scope using foundational knowledge of:

- TypeScript and Node.js
- Express.js routing and middleware
- PostgreSQL and an ORM or query builder
- JWT-based authentication
- RESTful API conventions

---

## 5. User Stories

### User Management

| ID | Story | Priority |
|----|-------|----------|
| US-1 | As a new user, I want to register with my name, email, and password so that I can create an account. | Must |
| US-2 | As a registered user, I want to log in with my email and password so that I receive a token for authenticated requests. | Must |
| US-3 | As an evaluator, I want to list all users so that I can verify registration is working. | Must |
| US-4 | As an evaluator, I want to retrieve a single user by ID so that I can inspect user data. | Must |
| US-5 | As a registered user, I want to update my profile information. | Must |
| US-6 | As a registered user, I want to delete my account. | Must |

### Task Management

| ID | Story | Priority |
|----|-------|----------|
| TS-1 | As an authenticated user, I want to create a task with a title, description, and status so that I can track my work. | Must |
| TS-2 | As any visitor, I want to list all tasks so that I can browse what exists. | Must |
| TS-3 | As an authenticated user, I want to view only my own tasks so that I can focus on my work. | Must |
| TS-4 | As any visitor, I want to view a single task by ID. | Must |
| TS-5 | As an authenticated user, I want to update a task I own (title, description, status). | Must |
| TS-6 | As an authenticated user, I want to delete a task I own. | Must |
| TS-7 | As any visitor, I want to view all tasks belonging to a specific user. | Must |

### Validation & Error Handling

| ID | Story | Priority |
|----|-------|----------|
| VE-1 | As a user, I want clear error messages when I submit invalid data so that I know what to fix. | Must |
| VE-2 | As a user, I want the API to return appropriate HTTP status codes so that my client can handle responses correctly. | Must |
| VE-3 | As a user, I want the API to reject requests to protected endpoints when I am not authenticated. | Must |

---

## 6. Functional Requirements

### 6.1 User Management

| ID | Requirement |
|----|-------------|
| FR-1 | The system must allow user registration with `name`, `email`, and `password`. |
| FR-2 | The system must hash passwords before storing them. Plaintext passwords must never be persisted. |
| FR-3 | The system must enforce unique email addresses. Duplicate registration attempts must return an error. |
| FR-4 | The system must authenticate users via email and password, returning a JWT on success. |
| FR-5 | The system must support retrieving all users and a single user by ID. |
| FR-6 | The system must support updating and deleting users by ID. |
| FR-7 | User responses must never include the password hash. |

### 6.2 Task Management

| ID | Requirement |
|----|-------------|
| FR-8 | The system must allow authenticated users to create tasks with `title`, `description`, and `status`. |
| FR-9 | Each task must be associated with the authenticated user who created it (via `userId` foreign key). |
| FR-10 | The system must support listing all tasks (public, no auth required). |
| FR-11 | The system must support retrieving a single task by ID (public). |
| FR-12 | The system must provide a `/tasks/my-tasks` endpoint that returns only the authenticated user's tasks. |
| FR-13 | The system must support updating a task. Only the task owner may update it. |
| FR-14 | The system must support deleting a task. Only the task owner may delete it. |
| FR-15 | The system must support retrieving all tasks for a given user ID via `/users/:id/tasks`. |

### 6.3 Authentication

| ID | Requirement |
|----|-------------|
| FR-16 | The system must use JWT (JSON Web Tokens) for authentication. |
| FR-17 | Tokens must be sent in the `Authorization` header using the `Bearer` scheme. |
| FR-18 | Protected endpoints must return `401 Unauthorized` when no token or an invalid token is provided. |
| FR-19 | Token expiration must be configurable via environment variables. |

### 6.4 Database

| ID | Requirement |
|----|-------------|
| FR-20 | The system must use PostgreSQL as the data store. |
| FR-21 | The schema must enforce a one-to-many relationship: one User has many Tasks. |
| FR-22 | Deleting a user should handle or cascade related tasks appropriately. |

---

## 7. API Feature Requirements

### 7.1 User Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/users` | No | Register a new user. |
| `GET` | `/users` | No | List all users. |
| `GET` | `/users/:id` | No | Get a single user by ID. |
| `PUT` | `/users/:id` | No | Update a user by ID. |
| `DELETE` | `/users/:id` | No | Delete a user by ID. |
| `POST` | `/users/login` | No | Authenticate and receive a JWT. |

#### `POST /users` — Register

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response:** `201 Created`

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T10:00:00.000Z"
}
```

**Error Response (duplicate email):** `409 Conflict`

```json
{
  "error": "Email already registered"
}
```

#### `POST /users/login` — Login

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Success Response:** `200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Response (invalid credentials):** `401 Unauthorized`

```json
{
  "error": "Invalid email or password"
}
```

#### `GET /users` — List All Users

**Success Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-03-11T10:00:00.000Z",
    "updatedAt": "2026-03-11T10:00:00.000Z"
  }
]
```

#### `GET /users/:id` — Get User by ID

**Success Response:** `200 OK`

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T10:00:00.000Z"
}
```

**Error Response:** `404 Not Found`

```json
{
  "error": "User not found"
}
```

#### `PUT /users/:id` — Update User

**Request Body** (partial update allowed):

```json
{
  "name": "John Updated"
}
```

**Success Response:** `200 OK`

```json
{
  "id": 1,
  "name": "John Updated",
  "email": "john@example.com",
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T10:30:00.000Z"
}
```

#### `DELETE /users/:id` — Delete User

**Success Response:** `204 No Content`

**Error Response:** `404 Not Found`

```json
{
  "error": "User not found"
}
```

---

### 7.2 Task Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/tasks` | Yes | Create a new task. |
| `GET` | `/tasks` | No | List all tasks. |
| `GET` | `/tasks/my-tasks` | Yes | Get the authenticated user's tasks. |
| `GET` | `/tasks/:id` | No | Get a single task by ID. |
| `PUT` | `/tasks/:id` | Yes | Update a task (owner only). |
| `DELETE` | `/tasks/:id` | Yes | Delete a task (owner only). |
| `GET` | `/users/:id/tasks` | No | Get all tasks for a specific user. |

#### `POST /tasks` — Create Task

**Headers:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "title": "Complete PRD review",
  "description": "Review and approve the product requirement document",
  "status": "pending"
}
```

**Success Response:** `201 Created`

```json
{
  "id": 1,
  "title": "Complete PRD review",
  "description": "Review and approve the product requirement document",
  "status": "pending",
  "userId": 1,
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T10:00:00.000Z"
}
```

#### `GET /tasks` — List All Tasks

**Success Response:** `200 OK`

```json
[
  {
    "id": 1,
    "title": "Complete PRD review",
    "description": "Review and approve the product requirement document",
    "status": "pending",
    "userId": 1,
    "createdAt": "2026-03-11T10:00:00.000Z",
    "updatedAt": "2026-03-11T10:00:00.000Z"
  }
]
```

#### `GET /tasks/my-tasks` — Get Current User's Tasks

**Headers:** `Authorization: Bearer <token>`

**Success Response:** `200 OK`

```json
[
  {
    "id": 1,
    "title": "Complete PRD review",
    "description": "Review and approve the product requirement document",
    "status": "pending",
    "userId": 1,
    "createdAt": "2026-03-11T10:00:00.000Z",
    "updatedAt": "2026-03-11T10:00:00.000Z"
  }
]
```

#### `PUT /tasks/:id` — Update Task

**Headers:** `Authorization: Bearer <token>`

**Request Body** (partial update allowed):

```json
{
  "status": "in_progress"
}
```

**Success Response:** `200 OK`

```json
{
  "id": 1,
  "title": "Complete PRD review",
  "description": "Review and approve the product requirement document",
  "status": "in_progress",
  "userId": 1,
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T11:00:00.000Z"
}
```

**Error Response (not owner):** `403 Forbidden`

```json
{
  "error": "You do not have permission to update this task"
}
```

#### `DELETE /tasks/:id` — Delete Task

**Headers:** `Authorization: Bearer <token>`

**Success Response:** `204 No Content`

**Error Response (not owner):** `403 Forbidden`

```json
{
  "error": "You do not have permission to delete this task"
}
```

#### `GET /users/:id/tasks` — Get Tasks by User ID

**Success Response:** `200 OK`

```json
[
  {
    "id": 1,
    "title": "Complete PRD review",
    "description": "Review and approve the product requirement document",
    "status": "pending",
    "userId": 1,
    "createdAt": "2026-03-11T10:00:00.000Z",
    "updatedAt": "2026-03-11T10:00:00.000Z"
  }
]
```

**Error Response:** `404 Not Found`

```json
{
  "error": "User not found"
}
```

---

## 8. Data Model Overview

### 8.1 Entity Relationship

```
┌──────────────┐       1 : N       ┌──────────────┐
│    Users      │──────────────────▶│    Tasks      │
└──────────────┘                    └──────────────┘
```

### 8.2 Users Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `SERIAL` | Primary Key |
| `name` | `VARCHAR(100)` | NOT NULL |
| `email` | `VARCHAR(255)` | NOT NULL, UNIQUE |
| `password` | `VARCHAR(255)` | NOT NULL (hashed) |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updatedAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

### 8.3 Tasks Table

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `SERIAL` | Primary Key |
| `title` | `VARCHAR(200)` | NOT NULL |
| `description` | `TEXT` | NULLABLE |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'pending'` |
| `userId` | `INTEGER` | NOT NULL, FOREIGN KEY → Users(id) ON DELETE CASCADE |
| `createdAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |
| `updatedAt` | `TIMESTAMP` | NOT NULL, DEFAULT NOW() |

### 8.4 Status Enum Values

| Value | Description |
|-------|-------------|
| `pending` | Task created, not started. |
| `in_progress` | Task is actively being worked on. |
| `completed` | Task is finished. |

---

## 9. UX Flow (API Usage Flow)

The following describes the expected interaction sequence from a consumer's perspective.

### 9.1 Registration & Login Flow

```
Client                                  Server
  │                                       │
  │  POST /users                          │
  │  { name, email, password }            │
  │──────────────────────────────────────▶│
  │                                       │  Validate input
  │                                       │  Hash password
  │                                       │  Insert into DB
  │◀──────────────────────────────────────│
  │  201 { id, name, email, timestamps }  │
  │                                       │
  │  POST /users/login                    │
  │  { email, password }                  │
  │──────────────────────────────────────▶│
  │                                       │  Verify credentials
  │                                       │  Generate JWT
  │◀──────────────────────────────────────│
  │  200 { token, user }                  │
  │                                       │
```

### 9.2 Task Management Flow (Authenticated)

```
Client                                  Server
  │                                       │
  │  POST /tasks                          │
  │  Authorization: Bearer <token>        │
  │  { title, description, status }       │
  │──────────────────────────────────────▶│
  │                                       │  Verify JWT
  │                                       │  Extract userId from token
  │                                       │  Validate input
  │                                       │  Insert task with userId
  │◀──────────────────────────────────────│
  │  201 { task }                         │
  │                                       │
  │  GET /tasks/my-tasks                  │
  │  Authorization: Bearer <token>        │
  │──────────────────────────────────────▶│
  │                                       │  Verify JWT
  │                                       │  Query tasks WHERE userId = token.userId
  │◀──────────────────────────────────────│
  │  200 [ ...tasks ]                     │
  │                                       │
  │  PUT /tasks/1                         │
  │  Authorization: Bearer <token>        │
  │  { status: "completed" }              │
  │──────────────────────────────────────▶│
  │                                       │  Verify JWT
  │                                       │  Verify ownership
  │                                       │  Update task
  │◀──────────────────────────────────────│
  │  200 { updated task }                 │
  │                                       │
```

### 9.3 Public Browsing Flow (No Auth)

```
Client                                  Server
  │                                       │
  │  GET /tasks                           │
  │──────────────────────────────────────▶│
  │◀──────────────────────────────────────│
  │  200 [ ...all tasks ]                 │
  │                                       │
  │  GET /tasks/5                         │
  │──────────────────────────────────────▶│
  │◀──────────────────────────────────────│
  │  200 { task }                         │
  │                                       │
  │  GET /users/1/tasks                   │
  │──────────────────────────────────────▶│
  │◀──────────────────────────────────────│
  │  200 [ ...user's tasks ]              │
  │                                       │
```

---

## 10. Validation Rules

Input validation is implemented with **Zod**. Zod schemas enforce the rules below and provide both runtime validation and TypeScript types. Validation runs in middleware before controllers; failed validation returns `400` with the structure in [§11.1](#111-response-format). Implementation details (schemas, middleware, error mapping) are in the technical RFC.

The following tables define the rules that must be enforced for each endpoint.

### 10.1 User Registration (`POST /users`)

| Field | Rules |
|-------|-------|
| `name` | Required. String. 1–100 characters. |
| `email` | Required. Must be a valid email format. Max 255 characters. |
| `password` | Required. Minimum 6 characters. |

### 10.2 User Login (`POST /users/login`)

| Field | Rules |
|-------|-------|
| `email` | Required. Must be a valid email format. |
| `password` | Required. Non-empty string. |

### 10.3 Task Creation (`POST /tasks`)

| Field | Rules |
|-------|-------|
| `title` | Required. String. 1–200 characters. |
| `description` | Optional. String. |
| `status` | Optional. Must be one of: `pending`, `in_progress`, `completed`. Defaults to `pending`. |

### 10.4 Task Update (`PUT /tasks/:id`)

| Field | Rules |
|-------|-------|
| `title` | Optional. String. 1–200 characters if provided. |
| `description` | Optional. String. |
| `status` | Optional. Must be one of: `pending`, `in_progress`, `completed` if provided. |

### 10.5 Path Parameters

| Parameter | Rules |
|-----------|-------|
| `:id` | Must be a positive integer. Return `400 Bad Request` if non-numeric. |

---

## 11. Error Handling Expectations

### 11.1 Response Format

All error responses must use a consistent JSON structure:

```json
{
  "error": "Human-readable error message"
}
```

For validation errors with multiple fields:

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Email is required" },
    { "field": "password", "message": "Password must be at least 6 characters" }
  ]
}
```

### 11.2 HTTP Status Code Usage

| Code | Usage |
|------|-------|
| `200` | Successful read or update. |
| `201` | Successful resource creation. |
| `204` | Successful deletion (no body). |
| `400` | Malformed request, validation failure, or invalid parameter. |
| `401` | Missing, expired, or invalid authentication token. |
| `403` | Authenticated but not authorized (e.g., updating another user's task). |
| `404` | Resource not found. |
| `409` | Conflict (e.g., duplicate email). |
| `500` | Unhandled server error. Must not expose stack traces or internal details. |

### 11.3 Global Error Handler

The application must include a global error-handling middleware that:

- Catches unhandled errors from all routes.
- Logs the error internally (to console at minimum).
- Returns a generic `500` response to the client without exposing implementation details.

---

## 12. Security Considerations

| Area | Requirement |
|------|-------------|
| **Password Storage** | Passwords must be hashed using `bcrypt` (or equivalent) with a minimum cost factor of 10. Plaintext passwords must never be stored or logged. |
| **JWT Secrets** | The signing secret must be stored in an environment variable (`JWT_SECRET`). It must not be hardcoded or committed to version control. |
| **Token Expiration** | JWTs must have a configurable expiration time (e.g., `JWT_EXPIRES_IN=1h`). Expired tokens must be rejected. |
| **Password in Responses** | The `password` field must be excluded from all API responses. |
| **SQL Injection** | Use parameterized queries or an ORM. Never interpolate user input directly into SQL strings. |
| **Environment Variables** | All configuration (database credentials, JWT secret, port) must be read from environment variables. A `.env.example` file must document required variables without real values. |
| **`.env` in `.gitignore`** | The actual `.env` file must be listed in `.gitignore` and never committed. |
| **`node_modules` in `.gitignore`** | The `node_modules` directory must be listed in `.gitignore`. |
| **Ownership Enforcement** | Task mutation endpoints (`PUT`, `DELETE`) must verify the authenticated user owns the target task before proceeding. |
| **Error Opacity** | Internal errors must not leak stack traces, file paths, or database structure to the client. |

### 12.1 Required Environment Variables

```
# .env.example

# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager
DB_USER=postgres
DB_PASSWORD=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=1h
```

---

## 13. Acceptance Criteria

Each criterion must pass for the submission to be considered complete.

### 13.1 User Management

- [ ] `POST /users` creates a user and returns the user object without the password.
- [ ] `POST /users` returns `409` if the email is already registered.
- [ ] `POST /users/login` returns a JWT and user object on valid credentials.
- [ ] `POST /users/login` returns `401` on invalid credentials.
- [ ] `GET /users` returns an array of all users without password fields.
- [ ] `GET /users/:id` returns a single user or `404`.
- [ ] `PUT /users/:id` updates the user and returns the updated object.
- [ ] `DELETE /users/:id` deletes the user and returns `204`.

### 13.2 Task Management

- [ ] `POST /tasks` requires a valid JWT. Returns `401` without one.
- [ ] `POST /tasks` creates a task linked to the authenticated user.
- [ ] `GET /tasks` returns all tasks without requiring authentication.
- [ ] `GET /tasks/:id` returns a single task or `404`.
- [ ] `GET /tasks/my-tasks` requires a valid JWT and returns only the authenticated user's tasks.
- [ ] `PUT /tasks/:id` requires a valid JWT and ownership. Returns `403` if the user does not own the task.
- [ ] `DELETE /tasks/:id` requires a valid JWT and ownership. Returns `403` if the user does not own the task.
- [ ] `GET /users/:id/tasks` returns all tasks for the given user or `404` if the user does not exist.

### 13.3 Validation & Error Handling

- [ ] Missing required fields return `400` with a descriptive error message.
- [ ] Invalid `status` values on tasks return `400`.
- [ ] Invalid `:id` parameters (non-numeric) return `400`.
- [ ] All error responses follow the documented JSON structure.
- [ ] Unhandled errors return `500` with a generic message (no stack trace).

### 13.4 Security

- [ ] Passwords are hashed in the database (not plaintext).
- [ ] No password hashes appear in any API response.
- [ ] JWT secret is read from an environment variable.
- [ ] Expired or malformed tokens return `401`.

### 13.5 Project Structure & Submission

- [ ] Code is in a public GitHub repository.
- [ ] `README.md` includes: project description, tech stack, installation steps, run instructions, database setup, API documentation, example requests/responses, and environment variable documentation.
- [ ] `.env.example` is present and documents all required variables.
- [ ] `.gitignore` excludes `node_modules` and `.env`.
- [ ] Project uses TypeScript.
- [ ] Project uses Express.js.
- [ ] Project uses PostgreSQL.
- [ ] Request body and query validation use **Zod** (schemas + validation middleware).

---

## 14. Success Metrics

These metrics define how submissions are evaluated. They are weighted to reflect the priorities of the assessment.

| Metric | Weight | Criteria |
|--------|--------|----------|
| **Functionality** | 30% | All endpoints work as specified. CRUD operations complete successfully. Authentication gate works correctly. |
| **Code Quality** | 20% | Clean project structure. Logical separation of concerns (routes, controllers, middleware, models). Consistent naming conventions. TypeScript used effectively (proper typing, no excessive `any`). |
| **Error Handling** | 15% | Consistent error response format. Appropriate HTTP status codes. Validation errors are specific and helpful. No unhandled promise rejections or uncaught exceptions crash the server. |
| **Security** | 15% | Passwords hashed. JWT implemented correctly. No secrets in code or version control. Ownership checks enforced. |
| **Database Design** | 10% | Correct one-to-many relationship. Proper use of foreign keys and constraints. Cascade behavior defined. |
| **Documentation** | 10% | README is complete and a developer can set up and run the project by following it. `.env.example` is present. API endpoints are documented with examples. |

### 14.1 Scoring Guide

| Score | Level | Description |
|-------|-------|-------------|
| 90–100 | Excellent | All acceptance criteria met. Clean code. Thoughtful error handling. Complete documentation. May include enhancements (pagination, input sanitization, request logging). |
| 75–89 | Good | Core functionality works. Minor gaps in validation or documentation. Code is readable and organized. |
| 60–74 | Acceptable | Most endpoints work. Some validation or error handling missing. Documentation is incomplete but project runs. |
| Below 60 | Needs Improvement | Significant functionality missing. Poor error handling. No documentation. Security issues present. |

---

*End of Document*
