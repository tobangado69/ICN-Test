# Technical RFC: Task Manager API

**RFC ID:** RFC-2026-001
**Title:** Task Manager API — Backend Architecture & Implementation
**Author:** Backend Engineering
**Status:** Proposed
**Created:** 2026-03-11
**Target Audience:** Development Team

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Goals](#2-goals)
3. [Non-Goals](#3-non-goals)
4. [System Architecture Overview](#4-system-architecture-overview)
5. [Folder Structure Proposal](#5-folder-structure-proposal)
6. [Database Schema Design](#6-database-schema-design)
7. [API Design](#7-api-design)
8. [Authentication Strategy](#8-authentication-strategy)
9. [Middleware Design](#9-middleware-design)
10. [Validation Strategy](#10-validation-strategy)
11. [Error Handling Strategy](#11-error-handling-strategy)
12. [Data Access Layer (Repository/Service Pattern)](#12-data-access-layer)
13. [Example Request/Response](#13-example-requestresponse)
14. [Security Considerations](#14-security-considerations)
15. [Performance Considerations](#15-performance-considerations)
16. [Trade-offs](#16-trade-offs)
17. [Future Improvements](#17-future-improvements)

---

## 1. Problem Statement

We need a backend service that allows teams to manage daily tasks. Users must be able to register, authenticate, and perform CRUD operations on tasks they own. Public consumers must be able to browse tasks and users without authentication.

No existing internal service covers this. We are building from scratch on Node.js/TypeScript with PostgreSQL.

The architecture must be clean enough for a junior developer to navigate, extend, and debug, while following industry conventions that prevent the codebase from degrading as it grows.

---

## 2. Goals

| ID | Goal |
|----|------|
| G1 | Deliver a RESTful API implementing full CRUD for Users and Tasks. |
| G2 | Implement JWT-based authentication that gates write operations on tasks. |
| G3 | Enforce a clear layered architecture: **Router → Controller → Service → Repository**. |
| G4 | Centralize cross-cutting concerns (auth, validation, error handling) in middleware. |
| G5 | Use PostgreSQL with a properly constrained schema and a query-builder (no raw string interpolation). |
| G6 | Externalize all configuration via environment variables. |
| G7 | Produce a codebase a junior developer can read top-to-bottom without tribal knowledge. |

---

## 3. Non-Goals

- **Frontend or SSR** — API only.
- **Role-based access control** — All authenticated users have equal permissions on their own resources.
- **Real-time features** — No WebSockets or SSE.
- **Containerization / CI/CD** — Out of scope for this RFC; covered separately.
- **Rate limiting / API gateway** — Deferred to infrastructure layer.
- **Pagination, filtering, sorting** — Not required in v1. Noted as a future improvement.
- **Email verification, password reset, OAuth** — Deferred.
- **File uploads or task attachments.**
- **Automated test suite** — Recommended but not specified here. Covered by a testing RFC.

---

## 4. System Architecture Overview

### 4.1 High-Level Architecture

```
┌─────────┐       HTTPS        ┌───────────────────────────────────┐
│  Client  │───────────────────▶│          Express Server           │
│ (Postman,│                    │                                   │
│  curl,   │                    │  ┌─────────────────────────────┐  │
│  app)    │                    │  │       Middleware Stack       │  │
└─────────┘                    │  │  ┌───────┐ ┌────┐ ┌──────┐  │  │
                               │  │  │ CORS  │ │JSON│ │Logger│  │  │
                               │  │  └───┬───┘ └──┬─┘ └──┬───┘  │  │
                               │  │      └────────┼──────┘      │  │
                               │  └───────────────┼─────────────┘  │
                               │                  ▼                │
                               │  ┌─────────────────────────────┐  │
                               │  │          Routers             │  │
                               │  │   /users    /tasks           │  │
                               │  └──────────┬──────────────────┘  │
                               │             ▼                     │
                               │  ┌─────────────────────────────┐  │
                               │  │       Controllers            │  │
                               │  │  Parse request, call service │  │
                               │  │  Format response             │  │
                               │  └──────────┬──────────────────┘  │
                               │             ▼                     │
                               │  ┌─────────────────────────────┐  │
                               │  │        Services              │  │
                               │  │  Business logic, orchestrate │  │
                               │  │  calls to repositories       │  │
                               │  └──────────┬──────────────────┘  │
                               │             ▼                     │
                               │  ┌─────────────────────────────┐  │
                               │  │      Repositories            │  │
                               │  │  Database queries only       │  │
                               │  └──────────┬──────────────────┘  │
                               │             ▼                     │
                               │  ┌─────────────────────────────┐  │
                               │  │     PostgreSQL (Knex.js)     │  │
                               │  └─────────────────────────────┘  │
                               └───────────────────────────────────┘
```

### 4.2 Layer Responsibilities

| Layer | Responsibility | Allowed Dependencies |
|-------|---------------|---------------------|
| **Router** | Declare routes, bind middleware, delegate to controller. | Controller, Middleware |
| **Controller** | Extract data from `req`, call service, send `res`. No business logic. | Service |
| **Service** | Business logic, validation orchestration, cross-entity coordination. | Repository, other Services |
| **Repository** | Database access. One repository per table. Returns plain objects. | Database client (Knex) |
| **Middleware** | Cross-cutting: auth, validation, error handling, logging. | Service (for auth lookup) |

**Rule:** Dependencies flow downward only. A Repository must never import a Controller. A Service must never import a Router.

### 4.3 Request Lifecycle

```
Incoming Request
      │
      ▼
  express.json()          ← Parse body
      │
      ▼
  cors()                  ← CORS headers
      │
      ▼
  requestLogger()         ← Log method, path, duration
      │
      ▼
  Router match            ← Match route pattern
      │
      ▼
  [authenticate()]        ← If protected: verify JWT, attach req.user
      │
      ▼
  [validate(schema)]      ← If applicable: validate body/params/query
      │
      ▼
  Controller method       ← Extract input, call service
      │
      ▼
  Service method          ← Business logic
      │
      ▼
  Repository method       ← SQL query via Knex
      │
      ▼
  Response sent           ← Controller formats and sends
      │
      ▼
  errorHandler()          ← If any layer threw: catch, format, respond
```

---

## 5. Folder Structure Proposal

```
task-manager-api/
├── src/
│   ├── config/
│   │   ├── database.ts            # Knex connection setup
│   │   └── environment.ts         # Environment variable loader & validation
│   │
│   ├── middleware/
│   │   ├── authenticate.ts        # JWT verification middleware
│   │   ├── validate.ts            # Request validation middleware (Zod)
│   │   ├── errorHandler.ts        # Global error handler
│   │   └── requestLogger.ts       # Request logging
│   │
│   ├── modules/
│   │   ├── users/
│   │   │   ├── user.routes.ts     # Route definitions
│   │   │   ├── user.controller.ts # Request/response handling
│   │   │   ├── user.service.ts    # Business logic
│   │   │   ├── user.repository.ts # Database queries
│   │   │   ├── user.schema.ts     # Zod validation schemas
│   │   │   └── user.types.ts      # TypeScript interfaces
│   │   │
│   │   └── tasks/
│   │       ├── task.routes.ts
│   │       ├── task.controller.ts
│   │       ├── task.service.ts
│   │       ├── task.repository.ts
│   │       ├── task.schema.ts
│   │       └── task.types.ts
│   │
│   ├── shared/
│   │   ├── errors.ts              # Custom error classes
│   │   └── types.ts               # Shared TypeScript types
│   │
│   ├── app.ts                     # Express app assembly (no listen)
│   └── server.ts                  # Entry point (calls app.listen)
│
├── migrations/
│   ├── 001_create_users.ts
│   └── 002_create_tasks.ts
│
├── .env.example
├── .gitignore
├── knexfile.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 5.1 Design Rationale

**Modules over type-grouping.** Files are grouped by domain (`users/`, `tasks/`), not by role (`controllers/`, `services/`). When a developer works on tasks, every relevant file is in one directory. This reduces cognitive overhead and scales better as modules are added.

**`app.ts` vs `server.ts` separation.** `app.ts` exports the configured Express application without calling `.listen()`. `server.ts` imports it and starts the server. This allows tests to import `app.ts` directly and use `supertest` without binding a port.

**`shared/` for cross-module code.** Custom error classes and shared types live here. If a utility applies to a single module, it stays in that module's directory.

**`config/` for infrastructure.** Database connections and environment loading are infrastructure concerns, not business logic. They live outside `modules/`.

---

## 6. Database Schema Design

### 6.1 Entity Relationship Diagram

```
┌────────────────────────┐          ┌────────────────────────┐
│         users           │          │         tasks           │
├────────────────────────┤          ├────────────────────────┤
│ id          SERIAL PK  │──┐       │ id          SERIAL PK  │
│ name        VARCHAR(100)│  │       │ title       VARCHAR(200)│
│ email       VARCHAR(255)│  │  1:N  │ description TEXT        │
│ password    VARCHAR(255)│  └──────▶│ status      VARCHAR(20) │
│ created_at  TIMESTAMP   │          │ user_id     INT FK      │
│ updated_at  TIMESTAMP   │          │ created_at  TIMESTAMP   │
└────────────────────────┘          │ updated_at  TIMESTAMP   │
                                    └────────────────────────┘
```

### 6.2 Migration: `001_create_users.ts`

```typescript
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name", 100).notNullable();
    table.string("email", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.timestamps(true, true); // created_at, updated_at
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("users");
}
```

### 6.3 Migration: `002_create_tasks.ts`

```typescript
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tasks", (table) => {
    table.increments("id").primary();
    table.string("title", 200).notNullable();
    table.text("description").nullable();
    table.string("status", 20).notNullable().defaultTo("pending");
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.timestamps(true, true);

    table.index("user_id");
    table.index("status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tasks");
}
```

### 6.4 Schema Decisions

| Decision | Rationale |
|----------|-----------|
| `SERIAL` primary keys | Simple auto-incrementing integers. Sufficient for this scale. UUIDs considered but deferred (see Trade-offs). |
| `ON DELETE CASCADE` on `user_id` | When a user is deleted, their tasks are removed. Prevents orphaned rows. Acceptable for this domain. |
| `status` as `VARCHAR(20)` | Simpler than a PostgreSQL `ENUM` type. Enum changes require `ALTER TYPE` migrations which are error-prone. Validation is enforced at the application layer. |
| Index on `user_id` | The `GET /tasks/my-tasks` and `GET /users/:id/tasks` endpoints query by `user_id`. An index prevents full table scans. |
| Index on `status` | Anticipates future filtering by status. Low cost to add now. |
| `timestamps(true, true)` | Knex helper that creates `created_at` and `updated_at` with `DEFAULT NOW()`. |

### 6.5 Column Naming Convention

The database uses **snake_case** (`user_id`, `created_at`). The application layer uses **camelCase** (`userId`, `createdAt`). Knex's `postProcessResponse` and `wrapIdentifier` hooks handle translation at the boundary:

```typescript
// src/config/database.ts
import knex from "knex";
import { environment } from "./environment";

function toCamelCase(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

function toSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

const db = knex({
  client: "pg",
  connection: {
    host: environment.DB_HOST,
    port: environment.DB_PORT,
    database: environment.DB_NAME,
    user: environment.DB_USER,
    password: environment.DB_PASSWORD,
  },
  postProcessResponse: (result) => {
    if (Array.isArray(result)) return result.map(toCamelCase);
    if (result && typeof result === "object") return toCamelCase(result);
    return result;
  },
  wrapIdentifier: (value, origImpl) => {
    return origImpl(toSnakeCase(value));
  },
});

export default db;
```

This ensures the database layer speaks SQL conventions while the application layer speaks JavaScript conventions, with zero manual mapping in business logic.

---

## 7. API Design

### 7.1 Route Table

| Method | Path | Auth | Handler | Description |
|--------|------|------|---------|-------------|
| `POST` | `/users` | No | `UserController.create` | Register user |
| `GET` | `/users` | No | `UserController.findAll` | List all users |
| `GET` | `/users/:id` | No | `UserController.findById` | Get user by ID |
| `PUT` | `/users/:id` | No | `UserController.update` | Update user |
| `DELETE` | `/users/:id` | No | `UserController.remove` | Delete user |
| `POST` | `/users/login` | No | `UserController.login` | Authenticate |
| `POST` | `/tasks` | Yes | `TaskController.create` | Create task |
| `GET` | `/tasks` | No | `TaskController.findAll` | List all tasks |
| `GET` | `/tasks/my-tasks` | Yes | `TaskController.findMyTasks` | User's own tasks |
| `GET` | `/tasks/:id` | No | `TaskController.findById` | Get task by ID |
| `PUT` | `/tasks/:id` | Yes | `TaskController.update` | Update task (owner) |
| `DELETE` | `/tasks/:id` | Yes | `TaskController.remove` | Delete task (owner) |
| `GET` | `/users/:id/tasks` | No | `UserController.findUserTasks` | Tasks by user |

### 7.2 Route Registration Order

Express matches routes in registration order. `/tasks/my-tasks` must be registered **before** `/tasks/:id`, otherwise `my-tasks` is captured as an `:id` parameter.

```typescript
// src/modules/tasks/task.routes.ts
import { Router } from "express";
import { authenticate } from "../../middleware/authenticate";
import { validate } from "../../middleware/validate";
import { TaskController } from "./task.controller";
import { createTaskSchema, updateTaskSchema } from "./task.schema";

const router = Router();
const controller = new TaskController();

// Static routes BEFORE parameterized routes
router.get("/my-tasks", authenticate, controller.findMyTasks);

router.post("/", authenticate, validate(createTaskSchema), controller.create);
router.get("/", controller.findAll);
router.get("/:id", controller.findById);
router.put("/:id", authenticate, validate(updateTaskSchema), controller.update);
router.delete("/:id", authenticate, controller.remove);

export default router;
```

### 7.3 URL Conventions

- Plural nouns for resource collections: `/users`, `/tasks`.
- Resource IDs in the path: `/users/:id`.
- Nested resources for read-only relationships: `/users/:id/tasks`.
- Action-based endpoints only where REST verbs don't fit: `/users/login`.
- No trailing slashes.
- No verbs in URLs except `/login` (widely accepted convention for auth).

---

## 8. Authentication Strategy

### 8.1 Mechanism: JWT (JSON Web Tokens)

**Why JWT over session-based auth:**

| Factor | JWT | Sessions |
|--------|-----|----------|
| Statefulness | Stateless — no server-side session store | Requires session store (memory, Redis, DB) |
| Scalability | Horizontally scalable with no shared state | Requires sticky sessions or shared store |
| Complexity | Lower for this project scope | Adds infrastructure dependency |
| Revocation | Cannot revoke mid-flight (mitigated by short expiry) | Immediate revocation possible |

JWT is the right trade-off for this project: simpler infrastructure, sufficient security with short expiry, and the industry-standard approach for API-first backends.

### 8.2 Token Lifecycle

```
┌──────────┐                          ┌──────────┐
│  Client   │                          │  Server   │
└─────┬────┘                          └─────┬────┘
      │  POST /users/login                   │
      │  { email, password }                 │
      │─────────────────────────────────────▶│
      │                                      │ 1. Look up user by email
      │                                      │ 2. Compare bcrypt hash
      │                                      │ 3. Sign JWT { sub: user.id }
      │  200 { token, user }                 │
      │◀─────────────────────────────────────│
      │                                      │
      │  POST /tasks                         │
      │  Authorization: Bearer <token>       │
      │  { title, description }              │
      │─────────────────────────────────────▶│
      │                                      │ 4. Verify JWT signature
      │                                      │ 5. Check expiration
      │                                      │ 6. Attach user to request
      │                                      │ 7. Proceed to controller
      │  201 { task }                        │
      │◀─────────────────────────────────────│
```

### 8.3 JWT Payload

```json
{
  "sub": 1,
  "iat": 1741651200,
  "exp": 1741654800
}
```

- `sub` — User ID. The only claim needed. User data is fetched from DB if required.
- `iat` — Issued at. Automatic.
- `exp` — Expiration. Configured via `JWT_EXPIRES_IN`.

**No sensitive data in the payload.** No email, name, or role. The token is a proof of identity, not a data carrier.

### 8.4 Implementation

```typescript
// src/middleware/authenticate.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { environment } from "../config/environment";
import { UnauthorizedError } from "../shared/errors";

interface JwtPayload {
  sub: number;
  iat: number;
  exp: number;
}

// Extend Express Request to include authenticated user info
declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication required");
  }

  const token = header.slice(7); // Remove "Bearer "

  try {
    const payload = jwt.verify(token, environment.JWT_SECRET) as JwtPayload;
    req.user = { id: payload.sub };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token has expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid token");
    }
    throw error;
  }
}
```

### 8.5 Token Generation (in UserService)

```typescript
// Inside src/modules/users/user.service.ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { environment } from "../../config/environment";

function generateToken(userId: number): string {
  return jwt.sign(
    { sub: userId },
    environment.JWT_SECRET,
    { expiresIn: environment.JWT_EXPIRES_IN }
  );
}

async function login(email: string, password: string) {
  const user = await userRepository.findByEmail(email);

  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const token = generateToken(user.id);

  // Strip password before returning
  const { password: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
}
```

**Note on error messages:** `"Invalid email or password"` is intentionally vague. Distinguishing between "user not found" and "wrong password" leaks information about which emails are registered.

---

## 9. Middleware Design

### 9.1 Middleware Stack

Middleware executes in the order it is registered. The order matters.

```typescript
// src/app.ts
import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import userRoutes from "./modules/users/user.routes";
import taskRoutes from "./modules/tasks/task.routes";

const app = express();

// ── Global Middleware (runs on every request) ──────────────────
app.use(cors());                       // 1. CORS headers
app.use(express.json());               // 2. Parse JSON bodies
app.use(requestLogger);                // 3. Log request info

// ── Routes ─────────────────────────────────────────────────────
app.use("/users", userRoutes);
app.use("/tasks", taskRoutes);

// ── Error Handler (must be last) ───────────────────────────────
app.use(errorHandler);

export default app;
```

### 9.2 Middleware Inventory

| Middleware | Scope | Purpose |
|-----------|-------|---------|
| `cors()` | Global | Allow cross-origin requests. |
| `express.json()` | Global | Parse `application/json` request bodies. |
| `requestLogger` | Global | Log method, path, status code, and response time. |
| `authenticate` | Per-route | Verify JWT, attach `req.user`. Applied only to protected routes. |
| `validate(schema)` | Per-route | Validate `req.body`, `req.params`, or `req.query` against a Zod schema. |
| `errorHandler` | Global (last) | Catch all errors, format response, prevent stack trace leaks. |

### 9.3 Request Logger

```typescript
// src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from "express";

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });

  next();
}
```

---

## 10. Validation Strategy

All request validation (body, query, path params where applicable) is implemented with **Zod**. Schemas live in module-level files (e.g. `user.schema.ts`, `task.schema.ts`); a shared `validate(schema)` middleware runs before controllers and maps `ZodError` to the standard validation error response.

### 10.1 Library: Zod

**Why Zod over alternatives:**

| Library | Pros | Cons |
|---------|------|------|
| **Zod** | TypeScript-native, infers types from schemas, zero dependencies, excellent error messages | Slightly slower than `ajv` at high throughput |
| `joi` | Mature, well-documented | No TypeScript type inference, larger bundle |
| `ajv` | Fastest JSON Schema validator | JSON Schema syntax is verbose, weak DX for TypeScript |
| `class-validator` | Decorator-based, pairs with `class-transformer` | Requires classes, heavier, more opinionated |

Zod wins on TypeScript ergonomics. Defining a schema gives you both runtime validation and a static type, eliminating duplication.

### 10.2 Schema Definitions

```typescript
// src/modules/users/user.schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: "Name is required" })
      .min(1, "Name cannot be empty")
      .max(100, "Name must be 100 characters or fewer"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format")
      .max(255),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format"),
    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required"),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
```

```typescript
// src/modules/tasks/task.schema.ts
import { z } from "zod";

const TASK_STATUSES = ["pending", "in_progress", "completed"] as const;

export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string({ required_error: "Title is required" })
      .min(1, "Title cannot be empty")
      .max(200, "Title must be 200 characters or fewer"),
    description: z
      .string()
      .optional(),
    status: z
      .enum(TASK_STATUSES, {
        errorMap: () => ({
          message: `Status must be one of: ${TASK_STATUSES.join(", ")}`,
        }),
      })
      .default("pending"),
  }),
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    status: z.enum(TASK_STATUSES).optional(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>["body"];
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>["body"];
```

### 10.3 Validation Middleware

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";
import { ValidationError } from "../shared/errors";

export function validate(schema: AnyZodObject) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((err) => ({
          field: err.path.slice(1).join("."), // Remove "body." prefix
          message: err.message,
        }));
        throw new ValidationError("Validation failed", details);
      }
      throw error;
    }
  };
}
```

### 10.4 Path Parameter Validation

Path parameters like `:id` are validated in the controller before passing to the service:

```typescript
function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new BadRequestError("ID must be a positive integer");
  }
  return id;
}
```

This is a deliberate choice to keep route definitions clean rather than adding Zod schemas for params on every route.

---

## 11. Error Handling Strategy

### 11.1 Custom Error Hierarchy

```typescript
// src/shared/errors.ts

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    public readonly validationDetails: { field: string; message: string }[]
  ) {
    super(400, message, validationDetails);
  }
}
```

### 11.2 Global Error Handler

```typescript
// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from "express";
import { AppError, ValidationError } from "../shared/errors";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Known application errors
  if (err instanceof ValidationError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.validationDetails,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // JSON parse errors (malformed request body)
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: "Malformed JSON in request body",
    });
    return;
  }

  // Unknown errors — log internally, return generic message
  console.error("Unhandled error:", err);

  res.status(500).json({
    error: "Internal server error",
  });
}
```

### 11.3 Error Response Formats

**Standard error:**

```json
{
  "error": "User not found"
}
```

**Validation error:**

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 6 characters" }
  ]
}
```

**Internal error (production):**

```json
{
  "error": "Internal server error"
}
```

### 11.4 Why Throw Instead of Passing to `next()`

Express 5 supports async error handling natively. For Express 4, we use a lightweight wrapper:

```typescript
// src/shared/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

All controller methods are wrapped with `asyncHandler`, so thrown errors (sync or async) propagate to the global error handler automatically. Services and repositories throw directly — they never catch and swallow errors unless they have recovery logic.

---

## 12. Data Access Layer

### 12.1 Pattern: Repository + Service

```
Controller ──▶ Service ──▶ Repository ──▶ Database
   (HTTP)      (Logic)      (Queries)      (PostgreSQL)
```

**Repository:** Pure data access. One per table. Methods return plain objects (not Express types). Never contains business logic.

**Service:** Business logic and orchestration. Calls one or more repositories. Throws domain errors (e.g., `NotFoundError`, `ForbiddenError`). Never touches `req` or `res`.

**Controller:** HTTP adapter. Extracts input from `req`, calls service, formats `res`. Contains no logic beyond parsing and formatting.

### 12.2 User Repository

```typescript
// src/modules/users/user.repository.ts
import db from "../../config/database";
import { User } from "./user.types";

export class UserRepository {
  private table = "users";

  async create(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const [user] = await db(this.table).insert(data).returning("*");
    return user;
  }

  async findAll(): Promise<Omit<User, "password">[]> {
    return db(this.table).select("id", "name", "email", "created_at", "updated_at");
  }

  async findById(id: number): Promise<User | undefined> {
    return db(this.table).where({ id }).first();
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return db(this.table).where({ email }).first();
  }

  async update(
    id: number,
    data: Partial<{ name: string; email: string; password: string }>
  ): Promise<User | undefined> {
    const [user] = await db(this.table)
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning("*");
    return user;
  }

  async delete(id: number): Promise<boolean> {
    const count = await db(this.table).where({ id }).del();
    return count > 0;
  }
}
```

### 12.3 User Service

```typescript
// src/modules/users/user.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "./user.repository";
import { environment } from "../../config/environment";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../shared/errors";
import { CreateUserInput, LoginInput } from "./user.schema";

const SALT_ROUNDS = 10;

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(input: CreateUserInput) {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await this.userRepository.create({
      ...input,
      password: hashedPassword,
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(input: LoginInput) {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await bcrypt.compare(input.password, user.password);

    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = jwt.sign(
      { sub: user.id },
      environment.JWT_SECRET,
      { expiresIn: environment.JWT_EXPIRES_IN }
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async findAll() {
    return this.userRepository.findAll();
  }

  async findById(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: number, input: Partial<{ name: string; email: string }>) {
    const user = await this.userRepository.update(id, input);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async remove(id: number) {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundError("User not found");
    }
  }
}
```

### 12.4 User Controller

```typescript
// src/modules/users/user.controller.ts
import { Request, Response } from "express";
import { UserService } from "./user.service";
import { UserRepository } from "./user.repository";
import { asyncHandler } from "../../shared/asyncHandler";
import { BadRequestError } from "../../shared/errors";

function parseId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new BadRequestError("ID must be a positive integer");
  }
  return id;
}

const userService = new UserService(new UserRepository());

export class UserController {
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const result = await userService.login(req.body);
    res.status(200).json(result);
  });

  findAll = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const users = await userService.findAll();
    res.status(200).json(users);
  });

  findById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id);
    const user = await userService.findById(id);
    res.status(200).json(user);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id);
    const user = await userService.update(id, req.body);
    res.status(200).json(user);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = parseId(req.params.id);
    await userService.remove(id);
    res.status(204).send();
  });
}
```

### 12.5 Task Service (Ownership Enforcement)

The task service is structurally similar to the user service but includes ownership checks on mutation operations:

```typescript
// src/modules/tasks/task.service.ts (relevant excerpt)
import { TaskRepository } from "./task.repository";
import { ForbiddenError, NotFoundError } from "../../shared/errors";
import { CreateTaskInput, UpdateTaskInput } from "./task.schema";

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  async create(input: CreateTaskInput, userId: number) {
    return this.taskRepository.create({ ...input, userId });
  }

  async update(id: number, input: UpdateTaskInput, userId: number) {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    if (task.userId !== userId) {
      throw new ForbiddenError("You do not have permission to update this task");
    }

    return this.taskRepository.update(id, input);
  }

  async remove(id: number, userId: number) {
    const task = await this.taskRepository.findById(id);

    if (!task) {
      throw new NotFoundError("Task not found");
    }

    if (task.userId !== userId) {
      throw new ForbiddenError("You do not have permission to delete this task");
    }

    await this.taskRepository.delete(id);
  }

  async findMyTasks(userId: number) {
    return this.taskRepository.findByUserId(userId);
  }

  async findAll() {
    return this.taskRepository.findAll();
  }

  async findById(id: number) {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError("Task not found");
    }
    return task;
  }
}
```

### 12.6 TypeScript Interfaces

```typescript
// src/modules/users/user.types.ts
export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

// src/modules/tasks/task.types.ts
export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 13. Example Request/Response

### 13.1 Express Server Setup

```typescript
// src/server.ts
import app from "./app";
import { environment } from "./config/environment";
import db from "./config/database";

async function main() {
  // Verify database connection before starting
  try {
    await db.raw("SELECT 1");
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }

  app.listen(environment.PORT, () => {
    console.log(`Server running on port ${environment.PORT}`);
  });
}

main();
```

```typescript
// src/config/environment.ts
import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const environment = {
  PORT: parseInt(process.env.PORT || "3000", 10),
  DB_HOST: requireEnv("DB_HOST"),
  DB_PORT: parseInt(process.env.DB_PORT || "5432", 10),
  DB_NAME: requireEnv("DB_NAME"),
  DB_USER: requireEnv("DB_USER"),
  DB_PASSWORD: requireEnv("DB_PASSWORD"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1h",
} as const;
```

### 13.2 Full Request/Response Examples

#### Register User

```
POST /users HTTP/1.1
Content-Type: application/json

{
  "name": "Alice Chen",
  "email": "alice@example.com",
  "password": "mySecureP4ss"
}
```

```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 1,
  "name": "Alice Chen",
  "email": "alice@example.com",
  "createdAt": "2026-03-11T10:00:00.000Z",
  "updatedAt": "2026-03-11T10:00:00.000Z"
}
```

#### Login

```
POST /users/login HTTP/1.1
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "mySecureP4ss"
}
```

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Alice Chen",
    "email": "alice@example.com"
  }
}
```

#### Create Task (Authenticated)

```
POST /tasks HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "title": "Review pull request #42",
  "description": "Check test coverage and error handling",
  "status": "pending"
}
```

```
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 1,
  "title": "Review pull request #42",
  "description": "Check test coverage and error handling",
  "status": "pending",
  "userId": 1,
  "createdAt": "2026-03-11T10:05:00.000Z",
  "updatedAt": "2026-03-11T10:05:00.000Z"
}
```

#### Update Task Not Owned → 403

```
PUT /tasks/1 HTTP/1.1
Content-Type: application/json
Authorization: Bearer <token-for-user-2>

{
  "status": "completed"
}
```

```
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "You do not have permission to update this task"
}
```

#### Validation Error

```
POST /users HTTP/1.1
Content-Type: application/json

{
  "name": "",
  "email": "not-an-email",
  "password": "123"
}
```

```
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Validation failed",
  "details": [
    { "field": "name", "message": "Name cannot be empty" },
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 6 characters" }
  ]
}
```

#### No Auth on Protected Route

```
POST /tasks HTTP/1.1
Content-Type: application/json

{
  "title": "Some task"
}
```

```
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Authentication required"
}
```

### 13.3 Environment Variables

```bash
# .env.example

# ── Server ──────────────────────────────────
PORT=3000

# ── Database ────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_manager
DB_USER=postgres
DB_PASSWORD=

# ── Authentication ──────────────────────────
JWT_SECRET=
JWT_EXPIRES_IN=1h
```

---

## 14. Security Considerations

| Area | Implementation | Risk if Ignored |
|------|---------------|-----------------|
| **Password hashing** | `bcrypt` with cost factor 10. | Plaintext passwords leaked in a breach. |
| **JWT secret** | Read from `JWT_SECRET` env var. Minimum 32 characters recommended. | Token forgery if secret is weak or committed to VCS. |
| **Token expiry** | Default 1 hour. Configurable via `JWT_EXPIRES_IN`. | Stolen tokens remain valid indefinitely. |
| **Password exclusion** | `password` field stripped from all API responses in the service layer. | Password hashes exposed to clients. |
| **SQL injection** | Knex parameterized queries. No string interpolation in SQL. | Arbitrary database access. |
| **Environment secrets** | `.env` in `.gitignore`. `.env.example` committed with empty values. | Secrets committed to version control. |
| **Ownership enforcement** | Task `PUT`/`DELETE` check `task.userId === req.user.id` before mutation. | Users modify or delete other users' data. |
| **Error opacity** | `500` responses return `"Internal server error"` only. Stack traces logged server-side. | Internal architecture exposed to attackers. |
| **Generic auth errors** | `"Invalid email or password"` — no distinction between wrong email and wrong password. | User enumeration attacks. |
| **JSON body limit** | `express.json({ limit: '1mb' })` | Denial of service via large payloads. |
| **CORS** | Configured per environment. Restrictive in production. | Cross-site request abuse. |

### 14.1 Dependency Security

- Run `npm audit` regularly.
- Pin major versions in `package.json`.
- `bcrypt` and `jsonwebtoken` are the only security-critical dependencies. Keep them updated.

---

## 15. Performance Considerations

### 15.1 Database

| Concern | Mitigation |
|---------|------------|
| Slow task lookups by user | Index on `tasks.user_id` (defined in migration). |
| Slow status filtering (future) | Index on `tasks.status` (defined in migration). |
| Connection overhead | Knex connection pool (default: min 2, max 10). Sufficient for this scale. |
| N+1 queries | Not a risk in the current API design — no nested eager loading. |

### 15.2 Application

| Concern | Mitigation |
|---------|------------|
| bcrypt blocking event loop | `bcrypt.hash` and `bcrypt.compare` are async (use libuv thread pool). Not a concern at this scale. |
| JWT verification cost | `jwt.verify` is synchronous but fast (~0.1ms). Acceptable. |
| Unbounded result sets | `GET /tasks` and `GET /users` return all rows. Acceptable for a small dataset. Pagination recommended when data grows. |
| Memory from large payloads | `express.json({ limit: '1mb' })` caps body size. |

### 15.3 What We Are Not Doing (and Why)

- **No caching layer.** Redis or in-memory caching is unnecessary at this scale and adds infrastructure complexity.
- **No response compression.** Could add `compression` middleware, but it adds latency for small JSON responses. Net negative for this API.
- **No database read replicas.** Single instance is sufficient.
- **No query result pagination.** Noted as a future improvement. Current dataset size does not justify the implementation cost.

---

## 16. Trade-offs

### 16.1 Knex vs. ORM (Prisma, TypeORM)

**Decision:** Knex (query builder).

| Factor | Knex | Prisma | TypeORM |
|--------|------|--------|---------|
| Learning curve | Low — writes SQL-like queries | Medium — schema DSL, client generation | Medium — decorators, entity classes |
| Transparency | High — you see the query being built | Medium — abstracted, generated client | Low — magic behind decorators |
| Migration story | Built-in, SQL-oriented | Built-in, schema-first | Built-in, synchronize or migration |
| TypeScript DX | Manual types required | Excellent auto-generated types | Good with decorators |
| Control | Full — raw SQL escape hatch | Limited — some queries need `$queryRaw` | Medium |

Knex was chosen because it teaches SQL thinking, gives full query control, and has minimal abstraction. The manual typing cost is acceptable for two tables.

### 16.2 Serial IDs vs. UUIDs

**Decision:** Serial integers.

- **Pro:** Simpler, smaller indexes, human-readable, natural sort order.
- **Con:** Leaks creation order, sequential guessing possible.
- **Justification:** This is an internal/assessment project. The simplicity benefit outweighs the security concern. If the API were public-facing with sensitive data, UUIDs would be preferred.

### 16.3 Stateless JWT vs. Sessions

**Decision:** JWT (covered in Section 8).

The inability to revoke JWTs mid-flight is the primary trade-off. Mitigation: short expiry (1 hour). For this project scope, the simplicity of stateless auth outweighs the revocation limitation.

### 16.4 VARCHAR Status vs. PostgreSQL ENUM

**Decision:** `VARCHAR(20)` with application-layer validation.

PostgreSQL ENUMs require `ALTER TYPE` to add values, which is awkward in migrations and cannot remove values without recreating the type. A VARCHAR with Zod validation is easier to evolve.

### 16.5 Flat vs. Nested Route Files

**Decision:** Module-based flat structure.

Each module (`users/`, `tasks/`) contains its own route file. Routes are mounted in `app.ts`. This avoids a monolithic `routes/index.ts` that grows unwieldy, and keeps route definitions close to their handlers.

---

## 17. Future Improvements

These are explicitly out of scope for v1 but documented for future reference.

| Priority | Improvement | Rationale |
|----------|-------------|-----------|
| **High** | Pagination on list endpoints | `GET /tasks` and `GET /users` will not scale beyond ~1000 rows without cursor or offset pagination. |
| **High** | Automated test suite | Unit tests for services, integration tests for routes using `supertest`. |
| **High** | Request rate limiting | Prevent brute-force login attempts. `express-rate-limit` with in-memory or Redis store. |
| **Medium** | Filtering and sorting | `GET /tasks?status=pending&sort=createdAt:desc`. |
| **Medium** | Refresh tokens | Pair short-lived access tokens (15 min) with long-lived refresh tokens. Enables revocation. |
| **Medium** | Soft deletes | Add `deleted_at` column instead of hard deletes. Enables recovery and audit trails. |
| **Medium** | Request ID and structured logging | Attach a UUID to each request (`X-Request-ID`). Use a structured logger (pino or winston) for JSON log output. |
| **Low** | Docker Compose setup | PostgreSQL + API in containers for one-command local development. |
| **Low** | OpenAPI / Swagger documentation | Auto-generate API docs from route definitions or Zod schemas. |
| **Low** | Health check endpoint | `GET /health` returning `{ status: "ok", db: "connected" }` for monitoring. |
| **Low** | Task assignment (multi-user) | Allow assigning tasks to other users. Changes the data model (assignee vs. creator). |

---

## Appendix A: Dependency Manifest

```json
{
  "dependencies": {
    "express": "^4.21.x",
    "knex": "^3.1.x",
    "pg": "^8.13.x",
    "bcrypt": "^5.1.x",
    "jsonwebtoken": "^9.0.x",
    "zod": "^3.23.x",
    "dotenv": "^16.4.x",
    "cors": "^2.8.x"
  },
  "devDependencies": {
    "typescript": "^5.6.x",
    "@types/express": "^5.0.x",
    "@types/bcrypt": "^5.0.x",
    "@types/jsonwebtoken": "^9.0.x",
    "@types/cors": "^2.8.x",
    "@types/node": "^22.x",
    "ts-node": "^10.9.x",
    "nodemon": "^3.1.x"
  }
}
```

## Appendix B: Knex Configuration

```typescript
// knexfile.ts
import { environment } from "./src/config/environment";

export default {
  client: "pg",
  connection: {
    host: environment.DB_HOST,
    port: environment.DB_PORT,
    database: environment.DB_NAME,
    user: environment.DB_USER,
    password: environment.DB_PASSWORD,
  },
  migrations: {
    directory: "./migrations",
    extension: "ts",
  },
  pool: {
    min: 2,
    max: 10,
  },
};
```

## Appendix C: npm Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "knex migrate:latest",
    "migrate:rollback": "knex migrate:rollback",
    "migrate:make": "knex migrate:make"
  }
}
```

## Appendix D: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

---

*End of RFC*
