# Doctor-Patient Consultation Backend

A RESTful backend API for a healthcare consultation platform built with **Node.js**, **Express**, **PostgreSQL**, and **Prisma ORM**. Patients can register, browse doctors, start consultations, and exchange chat messages with assigned doctors.

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Runtime        | Node.js 20+                        |
| Framework      | Express.js                          |
| Database       | PostgreSQL 16                       |
| ORM            | Prisma                              |
| Auth           | JWT (jsonwebtoken) + bcryptjs       |
| Docs           | Swagger / OpenAPI 3.0               |
| Real-time      | Socket.io (bonus)                   |
| Containerization | Docker + Docker Compose (bonus)   |

---

## Setup Instructions

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm or yarn

### 1. Clone & Install

```bash
git clone <repo-url>
cd doctor-patient-backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/doctor_patient_db?schema=public"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"
PORT=3000
```

### 3. Set Up Database

```bash
# Create the database first
createdb doctor_patient_db

# Run migrations
npx prisma migrate dev --name init

# Seed sample data
npm run db:seed
```

### 4. Start the Server

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:3000`
Swagger docs at `http://localhost:3000/api-docs`

### Docker Setup (Alternative)

```bash
docker-compose up --build
```

This starts both PostgreSQL and the API, runs migrations, and seeds data automatically.

---

## Database Schema

### ER Diagram

```
┌──────────────────────┐         ┌──────────────────────────┐
│       users           │         │     doctor_profiles       │
├──────────────────────┤         ├──────────────────────────┤
│ id          UUID PK  │───1:1──▶│ id              UUID PK  │
│ name        VARCHAR  │         │ specialization  VARCHAR  │
│ email       VARCHAR  │         │ years_of_exp    INT      │
│ password    VARCHAR  │         │ user_id         UUID FK  │
│ role        ENUM     │         └────────────┬─────────────┘
│ created_at  TIMESTAMP│                      │
│ updated_at  TIMESTAMP│                      │ 1:N
└───────┬──────────────┘                      │
        │ 1:N                                 │
        │                    ┌────────────────┴────────────┐
        │                    │       consultations          │
        │                    ├─────────────────────────────┤
        └───────────────────▶│ id               UUID PK    │
                             │ status           ENUM       │
                             │ patient_id       UUID FK    │
                             │ doctor_profile_id UUID FK   │
                             │ created_at       TIMESTAMP  │
                             │ updated_at       TIMESTAMP  │
                             └────────────┬────────────────┘
                                          │ 1:N
                                          │
                             ┌────────────┴────────────────┐
                             │         messages             │
                             ├─────────────────────────────┤
                             │ id               UUID PK    │
                             │ content          TEXT        │
                             │ consultation_id  UUID FK    │
                             │ sender_id        UUID FK    │
                             │ created_at       TIMESTAMP  │
                             └─────────────────────────────┘
```

### Relationships
- **User ↔ DoctorProfile**: One-to-one (only users with `role=DOCTOR`)
- **User ↔ Consultation**: One-to-many (as patient)
- **DoctorProfile ↔ Consultation**: One-to-many (as assigned doctor)
- **Consultation ↔ Message**: One-to-many
- **User ↔ Message**: One-to-many (as sender)

### Enums
- **Role**: `PATIENT`, `DOCTOR`
- **ConsultationStatus**: `PENDING`, `ACTIVE`, `COMPLETED`

---

## API Documentation

Base URL: `http://localhost:3000/api`

Interactive Swagger docs: `http://localhost:3000/api-docs`

### Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

---

### 1. Auth Endpoints

#### POST `/api/auth/register`

Register a new user (patient or doctor).

**Request Body (Patient):**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "securepass123",
  "role": "PATIENT"
}
```

**Request Body (Doctor):**
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "sarah@hospital.com",
  "password": "securepass123",
  "role": "DOCTOR",
  "specialization": "Cardiology",
  "yearsOfExperience": 12
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "Alice Smith",
      "email": "alice@example.com",
      "role": "PATIENT",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "doctorProfile": null
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST `/api/auth/login`

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "securepass123"
}
```

**Response (200):** Same structure as register response.

#### GET `/api/auth/profile` 🔒

Returns the authenticated user's profile.

---

### 2. Doctor Endpoints

#### GET `/api/doctors` 🔒

List all doctors (paginated).

**Query Parameters:**
| Param  | Default | Description       |
|--------|---------|-------------------|
| page   | 1       | Page number       |
| limit  | 10      | Items per page    |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doctor-profile-uuid",
      "userId": "user-uuid",
      "name": "Dr. Sarah Johnson",
      "email": "sarah@hospital.com",
      "specialization": "Cardiology",
      "yearsOfExperience": 12
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 4,
    "totalPages": 1
  }
}
```

#### GET `/api/doctors/:id` 🔒

Get a specific doctor by profile ID.

---

### 3. Consultation Endpoints

#### POST `/api/consultations` 🔒 (Patients only)

Create a new consultation.

**Request Body:**
```json
{
  "doctorId": "doctor-profile-uuid"
}
```

> **Note:** Use the doctor's `id` (profile ID) from `GET /api/doctors`, not their `userId`.

**Response (201):**
```json
{
  "success": true,
  "message": "Consultation created",
  "data": {
    "id": "consultation-uuid",
    "status": "PENDING",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "patient": { "id": "...", "name": "Alice Smith", "email": "..." },
    "doctor": {
      "profileId": "...",
      "userId": "...",
      "name": "Dr. Sarah Johnson",
      "specialization": "Cardiology"
    }
  }
}
```

#### GET `/api/consultations` 🔒

List your consultations (patients see theirs, doctors see assigned ones). Supports `page` and `limit` query params.

#### GET `/api/consultations/:id` 🔒

Get a specific consultation (participants only).

#### PATCH `/api/consultations/:id/status` 🔒 (Assigned doctor only)

Update consultation status.

**Request Body:**
```json
{
  "status": "ACTIVE"
}
```

**Status Transitions:**
| From      | Allowed To             |
|-----------|------------------------|
| PENDING   | ACTIVE, COMPLETED      |
| ACTIVE    | COMPLETED              |
| COMPLETED | *(none — immutable)*   |

---

### 4. Message Endpoints

#### POST `/api/consultations/:id/messages` 🔒

Send a message in a consultation (participants only, consultation must not be completed).

**Request Body:**
```json
{
  "content": "Hello doctor, I have a question about my symptoms."
}
```

#### GET `/api/consultations/:id/messages` 🔒

Get all messages in a consultation (chronological order, paginated). Supports `page` and `limit` query params.

---

### Error Response Format

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Description of the error",
  "errors": ["Field-level error 1", "Field-level error 2"]
}
```

**HTTP Status Codes Used:**
| Code | Meaning                              |
|------|--------------------------------------|
| 200  | Success                              |
| 201  | Created                              |
| 400  | Bad request / invalid state change   |
| 401  | Authentication required / failed     |
| 403  | Forbidden (wrong role / not participant) |
| 404  | Resource not found                   |
| 409  | Conflict (duplicate email)           |
| 422  | Validation error                     |
| 429  | Rate limit exceeded                  |
| 500  | Internal server error                |

---

## Project Structure

```
src/
├── app.js                    # Express app setup, middleware, server start
├── config/
│   ├── index.js              # Environment config
│   ├── database.js           # Prisma client singleton
│   ├── socket.js             # Socket.io setup (bonus)
│   └── swagger.js            # Swagger/OpenAPI config (bonus)
├── controllers/
│   ├── auth.controller.js    # Auth request handlers
│   ├── consultation.controller.js
│   ├── doctor.controller.js
│   └── message.controller.js
├── docs/
│   └── swagger.js            # Swagger route annotations
├── middleware/
│   ├── auth.js               # JWT authentication & role authorization
│   └── errorHandler.js       # Global error handler
├── routes/
│   ├── index.js              # Route aggregator
│   ├── auth.routes.js
│   ├── consultation.routes.js
│   └── doctor.routes.js
├── services/
│   ├── auth.service.js       # Auth business logic
│   ├── consultation.service.js
│   ├── doctor.service.js
│   └── message.service.js
├── utils/
│   ├── asyncHandler.js       # Async error wrapper
│   ├── errors.js             # Custom error classes
│   └── response.js           # Standardized response helpers
└── validators/
    └── index.js              # Request validation functions
```

---

## Bonus Features Implemented

| Feature                | Status |
|------------------------|--------|
| Swagger API Docs       | ✅     |
| Pagination             | ✅     |
| Docker + Docker Compose| ✅     |
| Socket.io (real-time)  | ✅     |
| Rate Limiting          | ✅     |
| Helmet (security headers) | ✅  |

---

## Seeded Test Data

After running `npm run db:seed`, these accounts are available:

| Role    | Email                        | Password      |
|---------|------------------------------|---------------|
| Doctor  | sarah.johnson@hospital.com   | Password123!  |
| Doctor  | michael.chen@hospital.com    | Password123!  |
| Doctor  | emily.williams@hospital.com  | Password123!  |
| Doctor  | james.brown@hospital.com     | Password123!  |
| Patient | alice@example.com            | Password123!  |
| Patient | bob@example.com              | Password123!  |

---

## Assumptions

1. **Doctor profiles are created during registration** — when a user registers with `role: DOCTOR`, they provide their specialization and years of experience upfront. There is no separate admin flow for creating doctor profiles.

2. **The `doctorId` in consultation creation refers to the DoctorProfile ID**, not the User ID. This is because the DoctorProfile is the domain entity that represents a doctor's practice.

3. **Both PENDING and ACTIVE consultations allow messaging** — the spec says "active consultations" but in practice a patient might message after creating a consultation (while it's still PENDING) before the doctor accepts. This felt like a better UX decision.

4. **No appointment scheduling** — consultations are on-demand; there's no date/time booking system.

5. **A patient can have multiple consultations with the same doctor** — there's no uniqueness constraint preventing this.

6. **Socket.io is set up for real-time message broadcasting** — the REST API remains the source of truth for sending messages; Socket.io broadcasts to connected clients for instant delivery.

7. **Rate limiting is set to 100 requests per 15 minutes** per IP — suitable for a demo; would need tuning in production.

---

## Scripts Reference

```bash
npm run dev          # Start with nodemon (hot reload)
npm start            # Start in production mode
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed sample data
npm run db:studio    # Open Prisma Studio (visual DB editor)
npm run db:reset     # Reset DB + re-seed
```
