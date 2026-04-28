# Swagger UI Testing Plan

Use this plan at the deployed `/api-docs` URL or locally at `http://localhost:3000/api-docs`.

All seed users have password `Password123!`.

- Admin: `admin@example.com`
- Project owner: `owner@example.com`
- Project editor: `editor@example.com`
- Project viewer: `viewer@example.com`
- Non-member/outsider: `outsider@example.com`

## Setup

1. Open Swagger UI.
2. Run `POST /api/auth/login` with `owner@example.com` and `Password123!`.
3. Copy the returned `token`.
4. Click Swagger `Authorize`.
5. Enter `Bearer <token>` and authorize.
6. Run `GET /api/projects`, `GET /api/tasks`, and `GET /api/comments` to identify current IDs. Use IDs from the responses in the steps below. For non-existent resources, use `999999`.

## Authentication

### POST /api/auth/signup

Access control: Public.

Success case:
1. Click `Try it out`.
2. Use a new email, for example:
   ```json
   { "email": "swagger.new@example.com", "password": "Password123!", "displayName": "Swagger New" }
   ```
3. Expect `201 Created` with `message` and a `user` object.

400 Bad Request:
1. Remove `password` or use `short`.
2. Expect `400 Bad Request`.

409 Conflict:
1. Use `owner@example.com`.
2. Expect `409 Conflict`.

### POST /api/auth/login

Access control: Public.

Success case:
1. Use:
   ```json
   { "email": "owner@example.com", "password": "Password123!" }
   ```
2. Expect `200 OK` with a JWT `token`.

400 Bad Request:
1. Remove `email` or `password`.
2. Expect `400 Bad Request`.

401 Unauthorized:
1. Use the wrong password.
2. Expect `401 Unauthorized`.

## Users

### GET /api/users/me

Access control: Authenticated user.

Success case:
1. Authorize with any valid JWT.
2. Click `Try it out`.
3. Expect `200 OK` with the current user profile.

401 Unauthorized:
1. Clear Swagger authorization.
2. Click `Try it out`.
3. Expect `401 Unauthorized`.

### GET /api/users

Access control: Admin only.

Success case:
1. Login as `admin@example.com`.
2. Authorize with the admin token.
3. Click `Try it out`.
4. Expect `200 OK` with all seed users.

403 Forbidden:
1. Login as `owner@example.com`.
2. Authorize with the owner token.
3. Click `Try it out`.
4. Expect `403 Forbidden`.

## Projects

### POST /api/projects

Access control: Authenticated users.

Success case:
1. Authorize as `owner@example.com`.
2. Use:
   ```json
   { "name": "Swagger Project", "description": "Created from Swagger", "status": "active" }
   ```
3. Expect `201 Created`. Copy the new project ID for update/delete tests.

400 Bad Request:
1. Send `{ "description": "Missing name" }`.
2. Expect `400 Bad Request`.

401 Unauthorized:
1. Clear Swagger authorization.
2. Retry the success body.
3. Expect `401 Unauthorized`.

### GET /api/projects

Access control: Authenticated users. Admin sees all projects; regular users see owned/member projects.

Success case:
1. Authorize as `owner@example.com`.
2. Click `Try it out`.
3. Expect `200 OK` with projects owned by or shared with the owner.

401 Unauthorized:
1. Clear Swagger authorization.
2. Click `Try it out`.
3. Expect `401 Unauthorized`.

### GET /api/projects/{id}

Access control: Project owner, member, or admin.

Success case:
1. Authorize as `owner@example.com`.
2. Use the ID for `Senior Design Sprint`.
3. Expect `200 OK` with project details and `memberCount`.

400 Bad Request:
1. Use `-10`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Use the ID for `Private Launch Plan`.
3. Expect `403 Forbidden`.

404 Not Found:
1. Use `999999`.
2. Expect `404 Not Found`.

### PUT /api/projects/{id}

Access control: Project owner or admin.

Success case:
1. Authorize as `owner@example.com`.
2. Use an owned project ID.
3. Send:
   ```json
   { "name": "Senior Design Sprint - Revised", "status": "active" }
   ```
4. Expect `200 OK` with updated values.

400 Bad Request:
1. Send `{ "status": "unknown" }`.
2. Expect `400 Bad Request`.

401 Unauthorized:
1. Clear Swagger authorization.
2. Retry the request.
3. Expect `401 Unauthorized`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Use the `Senior Design Sprint` project ID.
3. Expect `403 Forbidden`.

404 Not Found:
1. Authorize as `admin@example.com`.
2. Use `999999`.
3. Expect `404 Not Found`.

### DELETE /api/projects/{id}

Access control: Project owner or admin.

Success case:
1. Create a disposable project using `POST /api/projects`.
2. Use that new project ID.
3. Authorize as its owner.
4. Click `Try it out`.
5. Expect `200 OK` with `{ "status": "deleted" }`.

400 Bad Request:
1. Use `-10`.
2. Expect `400 Bad Request`.

401 Unauthorized:
1. Clear Swagger authorization.
2. Retry with a valid ID.
3. Expect `401 Unauthorized`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Use the `Senior Design Sprint` project ID.
3. Expect `403 Forbidden`.

404 Not Found:
1. Authorize as `admin@example.com`.
2. Use `999999`.
3. Expect `404 Not Found`.

### POST /api/projects/{id}/members

Access control: Project owner or admin.

Success case:
1. Authorize as `owner@example.com`.
2. Use the `Senior Design Sprint` project ID.
3. Use an existing user ID from `GET /api/users`:
   ```json
   { "userId": 5, "role": "viewer" }
   ```
4. Expect `201 Created` with the membership.

400 Bad Request:
1. Use role `owner` or `unknown`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Authorize as `editor@example.com`.
2. Retry the request.
3. Expect `403 Forbidden`.

404 Not Found:
1. Use `userId` `999999`.
2. Expect `404 Not Found`.

## Tasks

### POST /api/tasks

Access control: Project owner, project editor, or admin.

Success case:
1. Authorize as `editor@example.com`.
2. Use the `Senior Design Sprint` project ID and an assigned user who belongs to that project.
3. Send:
   ```json
   {
     "projectId": 1,
     "assignedUserId": 3,
     "title": "Swagger task",
     "description": "Created from Swagger",
     "priority": "high",
     "dueDate": "2026-05-15",
     "status": "todo"
   }
   ```
4. Expect `201 Created`. Copy the task ID.

400 Bad Request:
1. Remove `title` or use `priority: "urgent"`.
2. Expect `400 Bad Request`.

401 Unauthorized:
1. Clear Swagger authorization.
2. Retry the success body.
3. Expect `401 Unauthorized`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Retry the success body.
3. Expect `403 Forbidden`.

404 Not Found:
1. Authorize as `admin@example.com`.
2. Use `projectId` `999999`.
3. Expect `404 Not Found`.

### GET /api/tasks

Access control: Authenticated users with access to the parent project.

Success case:
1. Authorize as `owner@example.com`.
2. Optionally set `projectId` to the `Senior Design Sprint` project ID.
3. Expect `200 OK` with visible tasks.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Set `projectId` to the `Private Launch Plan` project ID.
3. Expect `403 Forbidden`.

401 Unauthorized:
1. Clear Swagger authorization.
2. Click `Try it out`.
3. Expect `401 Unauthorized`.

### GET /api/tasks/{id}

Access control: Project member, owner, or admin.

Success case:
1. Authorize as `viewer@example.com`.
2. Use a task ID from `Senior Design Sprint`.
3. Expect `200 OK`.

400 Bad Request:
1. Use `-10`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Use a task ID from `Private Launch Plan`.
3. Expect `403 Forbidden`.

404 Not Found:
1. Use `999999`.
2. Expect `404 Not Found`.

### PUT /api/tasks/{id}

Access control: Project owner, project editor, or admin.

Success case:
1. Authorize as `editor@example.com`.
2. Use a `Senior Design Sprint` task ID.
3. Send:
   ```json
   { "title": "Swagger task updated", "status": "in_progress", "dueDate": "2026-05-16" }
   ```
4. Expect `200 OK`.

400 Bad Request:
1. Use `status: "started"`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Retry the update.
3. Expect `403 Forbidden`.

404 Not Found:
1. Authorize as `admin@example.com`.
2. Use `999999`.
3. Expect `404 Not Found`.

### DELETE /api/tasks/{id}

Access control: Project owner, project editor, or admin.

Success case:
1. Create a disposable task with `POST /api/tasks`.
2. Authorize as `editor@example.com` or the project owner.
3. Delete the disposable task ID.
4. Expect `200 OK` with `{ "status": "deleted" }`.

400 Bad Request:
1. Use `-10`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Use a `Senior Design Sprint` task ID.
3. Expect `403 Forbidden`.

404 Not Found:
1. Authorize as `admin@example.com`.
2. Use `999999`.
3. Expect `404 Not Found`.

## Comments

### POST /api/comments

Access control: Project owner, member, or admin.

Success case:
1. Authorize as `viewer@example.com`.
2. Use a visible `Senior Design Sprint` task ID.
3. Send:
   ```json
   { "taskId": 1, "body": "Swagger comment from viewer." }
   ```
4. Expect `201 Created`. Copy the comment ID.

400 Bad Request:
1. Send an empty `body`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Use a task ID from `Private Launch Plan`.
3. Expect `403 Forbidden`.

404 Not Found:
1. Use `taskId` `999999`.
2. Expect `404 Not Found`.

### GET /api/comments

Access control: Authenticated users with access to the parent task/project.

Success case:
1. Authorize as `owner@example.com`.
2. Optionally set `taskId` to a visible task.
3. Expect `200 OK`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Set `taskId` to a `Private Launch Plan` task.
3. Expect `403 Forbidden`.

401 Unauthorized:
1. Clear Swagger authorization.
2. Click `Try it out`.
3. Expect `401 Unauthorized`.

### GET /api/comments/{id}

Access control: Comment author, project member, project owner, or admin.

Success case:
1. Authorize as `viewer@example.com`.
2. Use a comment ID from `Senior Design Sprint`.
3. Expect `200 OK`.

400 Bad Request:
1. Use `-10`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Authorize as `viewer@example.com`.
2. Use a comment ID from `Private Launch Plan` if one exists, or create one as outsider first.
3. Expect `403 Forbidden`.

404 Not Found:
1. Use `999999`.
2. Expect `404 Not Found`.

### PUT /api/comments/{id}

Access control: Comment author or admin.

Success case:
1. Create a comment as `viewer@example.com`.
2. Keep the viewer token authorized.
3. Send:
   ```json
   { "body": "Swagger comment updated by its author." }
   ```
4. Expect `200 OK`.

400 Bad Request:
1. Send `{ "body": "" }`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Authorize as `editor@example.com`.
2. Try to update the viewer-created comment.
3. Expect `403 Forbidden`.

404 Not Found:
1. Authorize as `admin@example.com`.
2. Use `999999`.
3. Expect `404 Not Found`.

### DELETE /api/comments/{id}

Access control: Comment author, project owner, or admin.

Success case:
1. Create a disposable comment as `viewer@example.com`.
2. Authorize as `owner@example.com`.
3. Delete that comment ID.
4. Expect `200 OK` with `{ "status": "deleted" }`.

400 Bad Request:
1. Use `-10`.
2. Expect `400 Bad Request`.

403 Forbidden:
1. Create a comment as `owner@example.com`.
2. Authorize as `editor@example.com`.
3. Try to delete the owner-created comment.
4. Expect `403 Forbidden`.

404 Not Found:
1. Authorize as `admin@example.com`.
2. Use `999999`.
3. Expect `404 Not Found`.
