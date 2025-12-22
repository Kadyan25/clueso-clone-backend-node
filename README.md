# Clueso Clone – Backend (Node + Express + Sequelize)

## Overview

This repository contains the **backend API** for a partial but coherent clone of [Clueso.io](https://www.clueso.io).[web:22][web:29]  
The backend acts as the **BFF layer** between:

- Next.js frontend
- Chrome extension
- MySQL database
- (Future) Python AI service

It provides:

- User signup/login with JWT
- Per-user sessions
- Automatic session creation from the Chrome extension
- Mock “AI processing” of sessions
- Feedback per session
- Extension event capture per session

---

## Features

- **Authentication**
  - Email + password-based signup and login
  - Passwords hashed with `bcrypt`
  - JWT tokens signed with `jsonwebtoken`
- **Sessions**
  - Each session belongs to a user
  - Status: `PENDING`, `PROCESSING`, `READY`, `FAILED`
  - Stores AI script text and a placeholder audio filename
  - New sessions can be created automatically from the Chrome extension via `/sessions/from-extension`
- **Feedback**
  - Users can create and list feedback entries per session
- **Extension events**
  - Chrome extension sends `{ url, steps[] }` to create a new session **and** its first `ExtensionEvent`
  - Additional events per session can be stored via the extension routes
- **Clean API**
  - Versioned REST API under `/api/v1`
- **Config & logging**
  - Server config via `server-config.js` (port, Python AI URL)
  - Structured logs via `winston` (console + `Alllogs.log`)

---

## Tech Stack

- **Runtime:** Node.js, Express
- **Database:** MySQL
- **ORM:** Sequelize
- **Auth:** JWT + bcrypt
- **Config:** dotenv + custom `ServerConfig`
- **Logging:** winston-based `Logger`
- **AI Integration:** HTTP call to a Python FastAPI layer (currently a mock/stub)

---

## Architecture

### High-level system

- **Frontend (Next.js)** calls this backend at `http://localhost:4000/api/v1/...` with a JWT.
- **Chrome extension** also calls this backend at `http://localhost:4000/api/v1/...`, using the same JWT stored in `chrome.storage.local`.
- **Backend** stores everything in MySQL and currently uses a **mock/placeholder AI** implementation in the session process route, with the endpoint shape designed to later call a Python FastAPI service.

### Folder structure (simplified)

src/
config/
config.json # Sequelize DB config (dev/test/prod)
index.js # exports ServerConfig, Logger
server-config.js # loads dotenv, exposes PORT and Python-related config
logger-config.js # winston logger
middlewares/
index.js
requireAuth.js # JWT verification
models/
index.js # Sequelize bootstrap
user.js
session.js
feedback.js
extensionEvent.js
repositories/
index.js
session-repository.js
feedback-repository.js
routes/
index.js # mounts /v1
v1/
index.js # mounts auth, session, extension routes
auth-routes.js # /auth/signup, /auth/login
session-routes.js # sessions + feedback + AI process + from-extension
extension-routes.js# additional extension event endpoints
index.js # Express app entry (uses ServerConfig + Logger)
scripts/
create-db.js # helper to create dev DB (if present)

text

---

## Data Models

### User

- `id`
- `email` (unique)
- `passwordHash`
- `createdAt`, `updatedAt`

### Session

- `id`
- `userId` (FK → `User.id`)
- `name` (e.g. `"Recording – 12/22/25, 10:30 AM"`)
- `description` (e.g. `"Recorded from https://example.com/page"`)
- `status` (`PENDING | PROCESSING | READY | FAILED`)
- `scriptText` (TEXT)
- `audioFileName` (string)
- `createdAt`, `updatedAt`

### Feedback

- `id`
- `sessionId` (FK → `Session.id`)
- `text`
- `createdAt`, `updatedAt`

### ExtensionEvent

- `id`
- `sessionId` (FK → `Session.id`)
- `url`
- `steps` (TEXT storing JSON array; getter parses to array, setter stringifies)
- `createdAt`, `updatedAt`

Associations: a `User` has many `Session`s; a `Session` has many `Feedback`s and `ExtensionEvent`s; each feedback/event belongs to a session.

---

## API Reference

Base URL in development:

http://localhost:4000/api/v1

text

All routes except signup/login require `Authorization: Bearer <JWT>`.

### Auth

#### POST `/auth/signup`

Body:

{
"email": "user@example.com",
"password": "secret123"
}

text

- Validates email + password (min length).
- Ensures email is unique.
- Hashes the password and creates a `User`.
- Returns:

{
"user": { "id": 1, "email": "user@example.com", "createdAt": "..." },
"token": "<JWT>"
}

text

#### POST `/auth/login`

Body:

{
"email": "user@example.com",
"password": "secret123"
}

text

- Verifies user and password.
- Returns the same `{ user, token }` shape.

---

### Sessions

#### POST `/sessions/from-extension` (auth required)

Used by the **Chrome extension** when the user clicks “Start Recording” on any page.

Request:

POST /api/v1/sessions/from-extension
Authorization: Bearer <JWT>
Content-Type: application/json

text

Body:

{
"url": "https://example.com/page",
"steps": [
{
"type": "capture",
"message": "Captured from extension start",
"url": "https://example.com/page",
"timestamp": "2025-12-22T10:30:00.000Z"
}
]
}

text

Behavior:

- Uses the authenticated `userId` from JWT.
- Creates a new `Session` with:
  - `name` = `Recording – <localized date/time>`
  - `description` = `Recorded from <url>`
  - `status = "PENDING"`
- Creates the first `ExtensionEvent` for this session using `{ url, steps }`.
- Returns:

{
"session": { ...session fields... },
"event": { ...extension event fields... }
}

text

This mirrors the real Clueso behavior where starting a recording automatically creates a project/session rather than using a manual form.[web:22]

> Note: the frontend does **not** call this endpoint directly; it is called by the Chrome extension’s background script.

#### GET `/sessions` (auth required)

- Returns all sessions belonging to the current user (ordered by `createdAt DESC`).
- Used by the `/sessions` page in the frontend.

#### GET `/sessions/:id` (auth required)

- Returns the session only if it belongs to the current user; otherwise 404.
- Used by the `/sessions/[id]` page.

#### POST `/sessions/:id/process` (auth required)

Triggers AI processing for a single session:

- Verifies the session belongs to the current user.
- Sets `status = "PROCESSING"`.
- Calls a simple Python AI stub (or mock) via HTTP:

POST ${PYTHON_AI_URL}/simple-generate

text

with:

{
"sessionId": 1,
"name": "Recording – 12/22/25, 10:30 AM"
}

text

- Receives `{ script, processed_audio_filename }` from Python (or mock).
- Updates the session:

{
"status": "READY",
"scriptText": "<script>",
"audioFileName": "<processed_audio_filename>"
}

text

- On error, attempts to mark status as `FAILED`.

Response:

{
"message": "Session processed successfully with Python AI",
"session": { ...updated session... }
}

text

The frontend’s **“Process with AI”** button on `/sessions` and `/sessions/[id]` calls this endpoint.

---

### Feedback

#### POST `/sessions/:id/feedback` (auth required)

Body:

{ "text": "Helpful script, but please simplify step 3." }

text

- Verifies the session belongs to the user.
- Creates a feedback row for that session.
- Returns the created feedback.

#### GET `/sessions/:id/feedback` (auth required)

- Verifies the session belongs to the user.
- Returns all feedback entries for that session.

---

### Extension Events (additional)

You can still record additional extension events for an existing session.

#### POST `/extension-events` (auth required)

Body:

{
"sessionId": 1,
"url": "https://example.com/page",
"steps": [
{ "type": "info", "message": "User clicked the extension again", "timestamp": "..." }
]
}

text

- Verifies that the session exists and belongs to the current user.
- Creates an `ExtensionEvent`.

#### GET `/sessions/:id/extension-events` (auth required)

- Returns all extension events for that session.

In the current clone, the **first** event for a session is usually created by `/sessions/from-extension`, and any additional events could use `/extension-events` if you extend the extension to capture more steps over time.

---

## Configuration & Environment

### Database (MySQL + Sequelize)

`src/config/config.json` defines the DB connection:

{
"development": {
"username": "root",
"password": "password",
"database": "clueso_clone_dev",
"host": "127.0.0.1",
"dialect": "mysql"
}
}

text

For local setup:

- Make sure a MySQL server is running.
- Create a database named `clueso_clone_dev` (or update `config.json` to match your credentials).

### Environment variables

The backend reads environment variables via `dotenv` in `server-config.js`.

Create a `.env` file in the repo root:

PORT=4000
JWT_SECRET=some-long-random-secret
PYTHON_AI_URL=http://localhost:8001 # optional, used by /sessions/:id/process

text

- `PORT` – port for the Express server.
- `JWT_SECRET` – secret used by `jsonwebtoken` to sign/verify tokens.
- `PYTHON_AI_URL` – base URL for the Python AI service; can point to a mock/stub.

---

## Running Locally (Step-by-step)

1. **Clone the repo**

git clone https://github.com/Kadyan25/clueso-clone-backend-node.git
cd clueso-clone-backend-node

text

2. **Install dependencies**

npm install

text

3. **Create `.env`**

PORT=4000
JWT_SECRET=dev-secret-change-me
PYTHON_AI_URL=http://localhost:8001

text

4. **Configure MySQL**

- Start MySQL locally.
- Ensure username/password and DB name in `src/config/config.json` are correct.
- Create the `clueso_clone_dev` database manually, or run the provided script if available:

npm run create-db

text

5. **Run migrations / sync models**

Depending on how Sequelize is configured, either run migrations or let `sequelize.sync()` create tables automatically (see `src/models/index.js`).

6. **Start the server**

npm run dev # recommended for development (nodemon)

or
npm start # plain node

text

7. **Test basic endpoints**

Using Postman or curl:

- **Signup**

POST http://localhost:4000/api/v1/auth/signup

text

- **Login**

POST http://localhost:4000/api/v1/auth/login

text

- **Sessions**

GET http://localhost:4000/api/v1/sessions
POST http://localhost:4000/api/v1/sessions/from-extension
POST http://localhost:4000/api/v1/sessions/:id/process

text

- **Feedback**

POST http://localhost:4000/api/v1/sessions/:id/feedback
GET http://localhost:4000/api/v1/sessions/:id/feedback

text

- **Extension events**

POST http://localhost:4000/api/v1/extension-events
GET http://localhost:4000/api/v1/sessions/:id/extension-events

text

---

## How It Works with the Frontend & Extension

1. User logs into the **frontend** and navigates to `/sessions`.
2. `AuthExtensionBridge` posts the JWT to `window`, and the content script writes it to `chrome.storage.local`.
3. User opens any page they want to capture.
4. User clicks the extension icon → popup → **Start Recording**.
5. The extension’s background script:
   - Reads `jwt` from `chrome.storage.local`.
   - Reads `tab.url`.
   - Calls `POST /api/v1/sessions/from-extension` with `{ url, steps }`.
6. Backend:
   - Creates a new `Session` + first `ExtensionEvent`.
   - Returns `{ session, event }`.
7. The extension opens `http://localhost:3000/sessions/<id>` in a new tab.
8. From the session detail page, the user clicks **Process with AI** → `POST /api/v1/sessions/:id/process`, which uses the Node mock AI (and later can call Python FastAPI).

---

## Limitations & Future Work

- In the reference Clueso architecture, the Chrome extension streams audio/video and interaction events into the Node layer, which forwards them to a Python AI pipeline that returns polished videos, scripts, and documentation in one go.[web:22][web:23]
- In this clone:
  - The extension sends **high-level steps and URL** instead of raw media.
  - Session creation is decoupled from AI processing: recording creates a session, and “Process with AI” is a separate explicit action.
  - The AI processing step currently uses a simple HTTP call to a mock Python endpoint (`/simple-generate`) to produce script text and an audio filename.
- There is no pagination, rate limiting, or advanced error handling; this is acceptable for the assignment but would need hardening for production.
- When the Python AI service is fully implemented, the `POST /api/v1/sessions/:id/process` endpoint can delegate to it without changing the frontend or extension, preserving the overall extension → backend → AI → frontend flow.