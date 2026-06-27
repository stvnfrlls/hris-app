# HRIS Frontend

A React-based Human Resource Information System frontend that consumes a Laravel 13 API with Sanctum token-based authentication.

## Tech Stack

- **React 18** with Vite
- **React Router v6** for client-side routing
- **Axios** for API communication
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **react-toastify** for toast notifications
- **React Context + useState + useEffect** for state management (no external library)

## Prerequisites

- Node.js 18+
- Laravel 13 API backend running at `http://localhost:8000`
- Backend must have CORS configured to allow `http://localhost:3000`
- Spatie Permission roles created: `admin`, `hr`, `employee`

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

The app runs at `http://localhost:3000` by default.

## Project Structure

```
src/
├── api/
│   └── axios.js              # Axios instance with auth interceptors
├── context/
│   └── AuthContext.jsx       # Auth state, login/logout, role helpers
├── hooks/
│   └── useAuth.js            # useContext wrapper with guard
├── components/
│   ├── ProtectedRoute.jsx    # Redirects unauthenticated users
│   └── layout/
│       └── AppLayout.jsx     # Sidebar layout with mobile drawer
└── pages/
    ├── LoginPage.jsx
    ├── DashboardPage.jsx
    ├── EmployeesPage.jsx
    ├── AttendancePage.jsx
    └── ProfilePage.jsx
```

## Tailwind CSS v4 Setup

This project uses Tailwind CSS v4, which differs from v3 in several ways:

- Installed via `npm install -D tailwindcss@latest @tailwindcss/vite`
- No `tailwind.config.js` required — v4 auto-detects content files
- Plugin registered in `vite.config.js` via `@tailwindcss/vite`
- Entry CSS uses `@import "tailwindcss"` instead of `@tailwind` directives
- `@apply` does **not** support referencing custom classes — all utilities are expanded inline

## Authentication

- Token-based via Laravel Sanctum
- Token stored in `localStorage` after login
- All requests include `Authorization: Bearer {token}` via Axios request interceptor
- On `401` response, localStorage is cleared and the user is redirected to `/login`

## Role-Based Access

Roles are returned from the API as `user.roles[{ id, name, guard_name, ... }]`.

| Role     | Access                                          |
|----------|-------------------------------------------------|
| `admin`  | Full access to all features                     |
| `hr`     | Manage employees, view and edit all attendance  |
| `employee` | Own data only, clock in/out                  |

## API Reference

**Base URL:** `http://localhost:8000/api`

### Auth

| Method | Endpoint       | Description                         |
|--------|----------------|-------------------------------------|
| POST   | `/auth/login`  | Login with `{ email, password }`    |
| GET    | `/auth/me`     | Get authenticated user with roles   |
| POST   | `/auth/logout` | Logout and invalidate token         |

### Employees

| Method | Endpoint           | Description          |
|--------|--------------------|----------------------|
| GET    | `/employees`       | Paginated list       |
| POST   | `/employees`       | Create employee      |
| PUT    | `/employees/{id}`  | Update employee      |
| DELETE | `/employees/{id}`  | Delete employee      |

**Employee fields:** `employee_code`, `department`, `position`, `employment_type` (`full_time` | `part_time` | `contractual`), `hire_date`, `status` (`active` | `inactive` | `terminated`)

### Attendance

| Method | Endpoint               | Description                    |
|--------|------------------------|--------------------------------|
| GET    | `/attendance`          | List records (filter by `date`, `status`) |
| POST   | `/attendance/clock-in` | Clock in                       |
| POST   | `/attendance/clock-out`| Clock out                      |
| PUT    | `/attendance/{id}`     | Update record (admin/hr only)  |

**Attendance fields:** `date`, `clock_in`, `clock_out`, `status` (`present` | `absent` | `late` | `half_day`), `remarks`

## Pages

### Login
Centered card with email/password form. On success, redirects to the originally requested page or `/dashboard`. Displays API error messages on failure.

### Dashboard
- **Employee view** — Clock widget showing today's attendance. Supports clock in/out with double-click prevention via `useRef`. Displays shift status and toast notifications.
- **Admin/HR view** — Summary cards showing Total Employees, Present Today, Late Today, and Absent Today (fetched in parallel).

### Employees *(admin/hr only)*
Paginated table with employee records. Supports adding, editing, and deleting employees via modals. Inline Laravel validation errors displayed per field. Modals close on Escape or backdrop click.

### Attendance
Filterable list of attendance records by date and status. Employees see their own records only. Admins and HR see all records with an Edit option. Filters auto-refetch on change.

### Profile
Displays authenticated user's avatar initials, full name, email, role, account ID, and member-since date. Seeds immediately from cached context, then refreshes from `GET /auth/me`.

## Global CSS Classes

Defined in `src/index.css` using `@layer components`:

| Class | Description |
|---|---|
| `.btn` | Base button |
| `.btn-primary`, `.btn-secondary`, `.btn-danger` | Button variants |
| `.input` | Form input |
| `.label` | Form label |
| `.card` | White rounded card with border and shadow |
| `.badge`, `.badge-green`, `.badge-red`, `.badge-yellow`, `.badge-blue`, `.badge-gray` | Status badges |
| `.th`, `.td` | Table header and cell |

> All classes use fully expanded utility strings — no `@apply` chaining between custom classes.

## Backend Setup Notes

- Roles must be created via Spatie Permission before assigning: `Role::create(['name' => 'admin'])`
- The `employees` table must be seeded separately — creating a user does not auto-create an employee record
- CORS must be configured to allow `http://localhost:3000`

## Routes

```
/login          → LoginPage (public)
/dashboard      → DashboardPage (protected)
/employees      → EmployeesPage (protected, admin/hr only in nav)
/attendance     → AttendancePage (protected)
/profile        → ProfilePage (protected)
*               → redirects to /dashboard
```