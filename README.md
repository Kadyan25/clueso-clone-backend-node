# Clueso Clone – Backend (Node + Express + Sequelize)

## Overview

This repository contains the **backend API** for a partial but coherent clone of [Clueso.io](https://www.clueso.io).[^1]
The backend acts as the **BFF layer** between:

- Next.js frontend
- Chrome extension
- MySQL database

It provides:

- User signup/login with JWT
- Per-user sessions
- Mock “AI processing” of sessions
- Feedback per session
- Extension event capture per session

***

## Features

- **Authentication**
    - Email + password-based signup and login
    - Passwords hashed with `bcrypt`
    - JWT tokens signed with `jsonwebtoken`
- **Sessions**
    - Each session belongs to a user
    - Status: `PENDING`, `PROCESSING`, `READY`, `FAILED`
    - Stores AI script text and a placeholder audio filename
- **Feedback**
    - Users can create and list feedback entries per session
- **Extension events**
    - Chrome extension sends `{ sessionId, url, steps[] }`
    - Backend stores events per session for the logged-in user
- **Clean API**
    - Versioned REST API under `/api/v1`
- **Config \& logging**
    - Server config via `server-config.js` (port, future Python config)
    - Structured logs via `winston` (console + `Alllogs.log`)

***

## Tech Stack

- **Runtime:** Node.js, Express
- **Database:** MySQL
- **ORM:** Sequelize
- **Auth:** JWT + bcrypt
- **Config:** dotenv + custom `ServerConfig`
- **Logging:** winston-based `Logger`

***

## Architecture

### High-level system

- **Frontend (Next.js)** calls this backend at `http://localhost:4000/api/v1/...` with a JWT.
- **Chrome extension** also calls this backend at `http://localhost:4000/api/v1/...`, using the same JWT stored in `chrome.storage.local`.
- **Backend** stores everything in MySQL and currently uses a **mock AI** implementation in the session process route.


### Folder structure (simplified)

```text
src/
  config/
    config.json         # Sequelize DB config (dev/test/prod)
    index.js            # exports ServerConfig, Logger
    server-config.js    # loads dotenv, exposes PORT and Python-related config
    logger-config.js    # winston logger
  middlewares/
    index.js
    requireAuth.js      # JWT verification
  models/
    index.js            # Sequelize bootstrap
    user.js
    session.js
    feedback.js
    extensionEvent.js
  repositories/
    index.js
    session-repository.js
    feedback-repository.js
  routes/
    index.js            # mounts /v1
    v1/
      index.js          # mounts auth, session, extension routes
      auth-routes.js    # /auth/signup, /auth/login
      session-routes.js # sessions + feedback + mock AI process
      extension-routes.js # extension event capture
index.js                # Express app entry (uses ServerConfig + Logger)
scripts/
  create-db.js          # helper to create dev DB (if present)
uploads/                # optional static files
recordings/             # optional static files
```


***

## Data Models

### User

- `id`
- `email` (unique)
- `passwordHash`
- `createdAt`, `updatedAt`


### Session

- `id`
- `userId` (FK → `User.id`)
- `name`
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
- `steps` (TEXT storing JSON array; getter parses to array)
- `createdAt`, `updatedAt`

Associations are set so a `User` has many `Session`s, a `Session` has many `Feedback`s and `ExtensionEvent`s, and each feedback/event belongs to a session.

***

## API Reference

Base URL in development:

```text
http://localhost:4000/api/v1
```

All routes except signup/login require `Authorization: Bearer <JWT>`.

### Auth

**POST `/auth/signup`**

- Body:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

- Validates email + password (min 6 chars).
- Ensures email is unique.
- Hashes the password.
- Creates a `User`.
- Returns:

```json
{
  "user": { "id": 1, "email": "user@example.com", "createdAt": "..." },
  "token": "<JWT>"
}
```


**POST `/auth/login`**

- Body:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

- Verifies user and password.
- Returns the same `{ user, token }` shape.


### Sessions

**POST `/sessions`** (auth required)

- Body:

```json
{
  "name": "My first session"
}
```

- Creates a new session for the logged-in user with `status = "PENDING"`.

**GET `/sessions`** (auth required)

- Returns all sessions belonging to the current user.

**GET `/sessions/:id`** (auth required)

- Returns the session only if it belongs to the current user; otherwise 404.

**POST `/sessions/:id/process`** (auth required)

- Simulates AI processing:
    - Sets `status = "PROCESSING"`.
    - Generates:
        - `scriptText = "This is a demo script for session \"<name>\"."`
        - `audioFileName = "demo_audio_<id>.mp3"`
    - Sets `status = "READY"`.
- Returns:

```json
{
  "message": "Session processed successfully (mock)",
  "session": { ...updated session... }
}
```


### Feedback

**POST `/sessions/:id/feedback`** (auth required)

- Body:

```json
{ "text": "Helpful script, but please simplify step 3." }
```

- Creates a feedback row for that session (if owned by the user).

**GET `/sessions/:id/feedback`** (auth required)

- Returns all feedback entries for that session.


### Extension Events

These endpoints are used by the Chrome extension to record context for a given session.

**POST `/extension-events`** (auth required)

- Body:

```json
{
  "sessionId": 1,
  "url": "http://localhost:3000/sessions/1",
  "steps": [
    { "type": "info", "message": "User clicked the extension", "timestamp": "..." }
  ]
}
```

- Verifies that the session exists and belongs to the current user.
- Creates an `ExtensionEvent`.

**GET `/sessions/:id/extension-events`** (auth required)

- Returns all extension events for that session.

***

## Configuration \& Environment

### Database (MySQL + Sequelize)

`src/config/config.json` defines the DB connection:

```json
{
  "development": {
    "username": "root",
    "password": "password",
    "database": "clueso_clone_dev",
    "host": "127.0.0.1",
    "dialect": "mysql"
  }
}
```

For local setup:

- Make sure a MySQL server is running.
- Create a database named `clueso_clone_dev` (or update `config.json` to match your credentials).[^2]


### Environment variables

The backend reads environment variables via `dotenv` in `server-config.js`.

For local development, create a `.env` file in the repo root:

```bash
PORT=4000
JWT_SECRET=some-long-random-secret
# Optional, reserved for future Python integration:
# DEEPGRAM_API_KEY=...
# PYTHON_LAYER_URL=http://localhost:8000
# PYTHON_SERVICE_TIMEOUT=30000
```

- `PORT` – port for the Express server.
- `JWT_SECRET` – secret used by `jsonwebtoken` to sign/verify tokens.

***

## Running Locally (Step-by-step)

1. **Clone the repo**
```bash
git clone https://github.com/Kadyan25/clueso-clone-backend-node.git
cd clueso-clone-backend-node
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env`**

Create a file named `.env` at the project root:

```bash
PORT=4000
JWT_SECRET=dev-secret-change-me
```

4. **Configure MySQL**

- Start MySQL locally.
- Ensure username/password and DB name in `src/config/config.json` are correct.
- Create the `clueso_clone_dev` database manually, or run the provided script if available:

```bash
npm run create-db
```


5. **Start the server**
```bash
npm run dev   # recommended for development (e.g. nodemon)
# or
npm start     # plain node
```

6. **Test basic endpoints**

Using Postman or curl:

- Signup:

```bash
POST http://localhost:4000/api/v1/auth/signup
```

- Login:

```bash
POST http://localhost:4000/api/v1/auth/login
```

- Use the returned JWT to hit:
    - `GET http://localhost:4000/api/v1/sessions`
    - `POST http://localhost:4000/api/v1/sessions`
    - `POST http://localhost:4000/api/v1/sessions/:id/process`
    - `POST http://localhost:4000/api/v1/extension-events`

***

## Limitations \& Future Work

- AI behavior is **mocked** in `POST /sessions/:id/process`; a real Python FastAPI service (Gemini + TTS) is planned but not wired yet.[^2]
- No pagination or advanced error handling; good enough for the assignment scope.
- DB credentials in `config.json` are development-friendly, not production-ready.
- CORS is open to all origins for ease of local development.

***
