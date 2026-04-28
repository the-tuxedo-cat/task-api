import { Router } from 'express';
import { asyncHandler, httpError } from '../lib/errors.js';
import { publicUser } from '../lib/formatters.js';
import { prisma } from '../lib/prisma.js';
import { isAdmin } from '../middleware/auth.js';

export const usersRouter = Router();

usersRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    res.json(publicUser(req.user));
  }),
);

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!isAdmin(req.user)) {
      throw httpError(403, 'FORBIDDEN', 'Only admins can list users');
    }
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    res.json(users.map(publicUser));
  }),
);
