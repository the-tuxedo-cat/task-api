export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Project Collaboration API',
    version: '1.0.0',
    description: 'REST API for collaborative projects, tasks, and comments with JWT authentication.',
  },
  servers: [{ url: '/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'BAD_REQUEST' },
              message: { type: 'string', example: 'name is required' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', example: 'owner@example.com' },
          displayName: { type: 'string', example: 'Olivia Owner' },
          role: { type: 'string', enum: ['user', 'admin'], example: 'user' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          ownerId: { type: 'integer', example: 2 },
          name: { type: 'string', example: 'Senior Design Sprint' },
          description: { type: 'string', nullable: true, example: 'Shared planning board for sprint work' },
          status: { type: 'string', enum: ['active', 'archived'], example: 'active' },
          memberCount: { type: 'integer', example: 3 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          projectId: { type: 'integer', example: 1 },
          assignedUserId: { type: 'integer', nullable: true, example: 3 },
          title: { type: 'string', example: 'Build login middleware' },
          description: { type: 'string', nullable: true, example: 'Create middleware for JWT verification' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], example: 'high' },
          dueDate: { type: 'string', nullable: true, example: '2026-05-15' },
          status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'], example: 'todo' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          taskId: { type: 'integer', example: 1 },
          authorId: { type: 'integer', example: 2 },
          body: { type: 'string', example: 'I finished the token verification middleware and started testing.' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Authentication'],
        summary: 'Create a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                email: 'new.user@example.com',
                password: 'Password123!',
                displayName: 'New User',
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User account created',
            content: {
              'application/json': {
                example: {
                  message: 'User account created successfully',
                  user: { id: 10, email: 'new.user@example.com', displayName: 'New User', role: 'user' },
                },
              },
            },
          },
          400: { description: 'Invalid signup body', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Log in and receive a JWT',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              examples: {
                owner: { value: { email: 'owner@example.com', password: 'Password123!' } },
                admin: { value: { email: 'admin@example.com', password: 'Password123!' } },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                example: {
                  message: 'Login successful',
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  user: { id: 2, email: 'owner@example.com', displayName: 'Olivia Owner', role: 'user' },
                },
              },
            },
          },
          400: { description: 'Missing email or password', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get the current user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { description: 'Missing or invalid JWT', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List users for finding seed IDs',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Users',
            content: {
              'application/json': {
                example: [
                  { id: 1, email: 'admin@example.com', displayName: 'Ada Admin', role: 'admin' },
                  { id: 2, email: 'owner@example.com', displayName: 'Olivia Owner', role: 'user' },
                ],
              },
            },
          },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Admin role required' },
        },
      },
    },
    '/projects': {
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                name: 'Senior Design Sprint',
                description: 'Shared planning board for sprint work',
                status: 'active',
              },
            },
          },
        },
        responses: {
          201: { description: 'Created project', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          400: { description: 'Invalid body' },
          401: { description: 'Missing or invalid JWT' },
        },
      },
      get: {
        tags: ['Projects'],
        summary: 'List visible projects',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Projects visible to this user',
            content: {
              'application/json': {
                example: [{ id: 1, ownerId: 2, name: 'Senior Design Sprint', description: 'Shared planning board for sprint work', status: 'active' }],
              },
            },
          },
          401: { description: 'Missing or invalid JWT' },
        },
      },
    },
    '/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Get one project',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Project', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          400: { description: 'Invalid ID' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'No project access' },
          404: { description: 'Project not found' },
        },
      },
      put: {
        tags: ['Projects'],
        summary: 'Update a project',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { example: { name: 'Senior Design Sprint - Revised', status: 'active' } } } },
        responses: {
          200: { description: 'Updated project', content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } } },
          400: { description: 'Invalid ID or body' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Owner or admin required' },
          404: { description: 'Project not found' },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted project', content: { 'application/json': { example: { id: 1, name: 'Senior Design Sprint', status: 'deleted' } } } },
          400: { description: 'Invalid ID' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Owner or admin required' },
          404: { description: 'Project not found' },
        },
      },
    },
    '/projects/{id}/members': {
      post: {
        tags: ['Projects'],
        summary: 'Add or update a project member',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { example: { userId: 3, role: 'editor' } } } },
        responses: {
          201: { description: 'Membership created or updated', content: { 'application/json': { example: { id: 2, projectId: 1, userId: 3, role: 'editor' } } } },
          400: { description: 'Invalid body' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Owner or admin required' },
          404: { description: 'Project or user not found' },
        },
      },
    },
    '/tasks': {
      post: {
        tags: ['Tasks'],
        summary: 'Create a task',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              example: {
                projectId: 1,
                assignedUserId: 3,
                title: 'Build login middleware',
                description: 'Create middleware for JWT verification',
                priority: 'high',
                dueDate: '2026-05-15',
                status: 'todo',
              },
            },
          },
        },
        responses: {
          201: { description: 'Created task', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
          400: { description: 'Invalid body' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Write access required' },
          404: { description: 'Project or assigned user not found' },
        },
      },
      get: {
        tags: ['Tasks'],
        summary: 'List visible tasks',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'projectId', in: 'query', schema: { type: 'integer' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'in_progress', 'done', 'blocked'] } },
          { name: 'assignedUserId', in: 'query', schema: { type: 'integer' } },
        ],
        responses: {
          200: { description: 'Tasks', content: { 'application/json': { example: [{ id: 1, projectId: 1, title: 'Build login middleware', priority: 'high', status: 'todo', assignedUserId: 3 }] } } },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Requested project is not visible' },
        },
      },
    },
    '/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get one task',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Task', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
          400: { description: 'Invalid ID' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'No parent project access' },
          404: { description: 'Task not found' },
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update a task',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { example: { title: 'Build login middleware', status: 'in_progress', dueDate: '2026-05-16' } } } },
        responses: {
          200: { description: 'Updated task', content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } } },
          400: { description: 'Invalid ID or body' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Write access required' },
          404: { description: 'Task not found' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted task', content: { 'application/json': { example: { id: 1, title: 'Build login middleware', status: 'deleted' } } } },
          400: { description: 'Invalid ID' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Write access required' },
          404: { description: 'Task not found' },
        },
      },
    },
    '/comments': {
      post: {
        tags: ['Comments'],
        summary: 'Create a comment',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { example: { taskId: 1, body: 'I finished the token verification middleware and started testing.' } } } },
        responses: {
          201: { description: 'Created comment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } } },
          400: { description: 'Invalid body' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'No parent project access' },
          404: { description: 'Task not found' },
        },
      },
      get: {
        tags: ['Comments'],
        summary: 'List visible comments',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'taskId', in: 'query', schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Comments', content: { 'application/json': { example: [{ id: 1, taskId: 1, authorId: 2, body: 'I finished the token verification middleware and started testing.' }] } } },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Requested task is not visible' },
        },
      },
    },
    '/comments/{id}': {
      get: {
        tags: ['Comments'],
        summary: 'Get one comment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Comment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } } },
          400: { description: 'Invalid ID' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'No parent project access' },
          404: { description: 'Comment not found' },
        },
      },
      put: {
        tags: ['Comments'],
        summary: 'Update a comment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { example: { body: 'I finished the middleware and added expiration checks.' } } } },
        responses: {
          200: { description: 'Updated comment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Comment' } } } },
          400: { description: 'Invalid ID or body' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Author or admin required' },
          404: { description: 'Comment not found' },
        },
      },
      delete: {
        tags: ['Comments'],
        summary: 'Delete a comment',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted comment', content: { 'application/json': { example: { id: 1, body: 'I finished the token verification middleware and started testing.', status: 'deleted' } } } },
          400: { description: 'Invalid ID' },
          401: { description: 'Missing or invalid JWT' },
          403: { description: 'Author, project owner, or admin required' },
          404: { description: 'Comment not found' },
        },
      },
    },
  },
};
