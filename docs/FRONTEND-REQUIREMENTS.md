# Frontend Requirements — Task Manager

**Version:** 1.0  
**Date:** March 11, 2026  
**Status:** Draft  
**Related:** [PRD-Task-Manager-API.md](./PRD-Task-Manager-API.md)

---

## Overview

Minimal frontend interface for the Task Manager API. Simple UI focused on functionality, not complex design.

---

## 1. Pages

### 1.1 Login / Register Page

**Layout:** Single page with two forms or tabs (login / register).

**Login Form:**
- Input: email, password
- Button: Login
- Link or button to switch to register form

**Register Form:**
- Input: name, email, password
- Button: Register
- Link or button to switch to login form

**Flow:** After successful login/register → redirect to Dashboard.

---

### 1.2 Task List (Dashboard) Page

**Content:**
- List of tasks belonging to the logged-in user
- Task status displayed (completed / not completed)
- Logout button

**Interactions:**
- Button to create a new task
- Edit button on each task
- Delete button on each task (with confirmation)
- Toggle to change completed status

**Flow:** If user is not logged in → redirect to Login/Register.

---

### 1.3 Create / Edit Task Form

**Inputs:**
- Task title (required)
- Description (optional)
- Checkbox or toggle for status (pending / in_progress / completed)

**Buttons:**
- Save
- Cancel (return to Dashboard)

**Mode:** Same form can be used for both create and edit (reuse).

---

## 2. Interaction Features

| Feature | Description |
|---------|-------------|
| ✅ Create new task | Create button → form → save → API POST /tasks |
| ✅ Edit / update task | Edit button → form pre-filled with existing data → save → API PUT /tasks/:id |
| ✅ Delete task | Delete button → confirmation (alert/confirm) → API DELETE /tasks/:id |
| ✅ Toggle completed status | Toggle/checkbox → API PUT /tasks/:id with new status |
| ✅ Error / success messages | Display API error messages or success toast/alert |

---

## 3. Technical Notes (Frontend)

### 3.1 API Client

- Use **fetch** or **axios** to call the API
- Set header `Authorization: Bearer <token>` for endpoints that require auth
- Store token in **localStorage** after login

### 3.2 UI / Styling

- Simple UI — you may use:
  - Plain HTML + CSS
  - Tailwind CSS
  - Component library (Bootstrap, Material UI, shadcn/ui, etc.)
- No complex design required — focus on functionality

### 3.3 State Management

- Keep it simple:
  - **useState** (React) for local state
  - **Context API** for user/token if needed
  - **localStorage** to persist JWT token

### 3.4 Routing

- Basic routing:
  - `/` or `/login` → Login/Register
  - `/dashboard` or `/tasks` → Task List (Dashboard)
- If user is not logged in and accesses dashboard → redirect to login

---

## 4. API Mapping

| Frontend Action | API Endpoint |
|-----------------|--------------|
| Login | POST /users/login |
| Register | POST /users |
| List my tasks | GET /tasks/my-tasks (Bearer token) |
| Create task | POST /tasks (Bearer token) |
| Update task | PUT /tasks/:id (Bearer token) |
| Delete task | DELETE /tasks/:id (Bearer token) |
| Logout | — (remove token from localStorage, redirect to login) |

---

## 5. References

- [PRD-Task-Manager-API.md](./PRD-Task-Manager-API.md) — Backend requirements
- [RFC-Task-Manager-API.md](./RFC-Task-Manager-API.md) — API architecture
- README.md (project root) — API endpoints documentation
