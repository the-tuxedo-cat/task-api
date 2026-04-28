# Project Collaboration API

REST API for managing collaborative projects, tasks, and comments. This implementation follows the phase-one design document included in this directory.

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT authentication
- bcrypt password hashing
- Swagger UI documentation

## Local Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create database tables and seed sample data:

   ```bash
   npm run db:push
   npm run seed
   ```

4. Start the server:

   ```bash
   npm run dev
   ```

Swagger UI is available at `http://localhost:3000/api-docs`.
The OpenAPI JSON is available at `http://localhost:3000/openapi.json`.

## Seed Accounts

All seed users use password `Password123!`.

- `admin@example.com` - admin
- `owner@example.com` - regular user and project owner
- `editor@example.com` - regular user with editor membership
- `viewer@example.com` - regular user with viewer membership
- `outsider@example.com` - regular user who owns a separate private project

## Render Deployment

This project includes `render.yaml`. Render should use:

- Build command: `npm install && npm run render-build`
- Start command: `npm start`

The `render-build` script runs `prisma db push` and `prisma db seed`, so the deployed PostgreSQL database has sample data available for Swagger testing.

## Testing Plan

The step-by-step Swagger UI testing plan is in `docs/TESTING_PLAN.md`.
