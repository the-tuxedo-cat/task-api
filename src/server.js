import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { commentsRouter } from './routes/comments.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { tasksRouter } from './routes/tasks.js';
import { usersRouter } from './routes/users.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './lib/errors.js';
import { openApiSpec } from './openapi.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'Project Collaboration API',
    status: 'ok',
    docs: '/api-docs',
    openapi: '/openapi.json',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use('/api/auth', authRouter);
app.use('/api/users', authenticate, usersRouter);
app.use('/api/projects', authenticate, projectsRouter);
app.use('/api/tasks', authenticate, tasksRouter);
app.use('/api/comments', authenticate, commentsRouter);
app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(port, () => {
    console.log(`Project Collaboration API listening on port ${port}`);
  });

  server.on('error', (error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
}

export { app };
