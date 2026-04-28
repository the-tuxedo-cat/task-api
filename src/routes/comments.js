import { Router } from 'express';
import { asyncHandler } from '../lib/errors.js';
import { commentJson } from '../lib/formatters.js';
import { getCommentForUser, getTaskForUser } from '../lib/policies.js';
import { prisma } from '../lib/prisma.js';
import { positiveInt, requiredString } from '../lib/validation.js';
import { isAdmin } from '../middleware/auth.js';

export const commentsRouter = Router();

commentsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const taskId = positiveInt(req.body.taskId, 'taskId');
    await getTaskForUser(taskId, req.user, 'read');
    const body = requiredString(req.body.body, 'body');

    const comment = await prisma.comment.create({
      data: { taskId, authorId: req.user.id, body },
    });

    res.status(201).json(commentJson(comment));
  }),
);

commentsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {};

    if (req.query.taskId !== undefined) {
      const taskId = positiveInt(req.query.taskId, 'taskId');
      const task = await getTaskForUser(taskId, req.user, 'read');
      where.taskId = task.id;
    } else if (!isAdmin(req.user)) {
      where.task = {
        is: {
          project: {
            is: {
              OR: [{ ownerId: req.user.id }, { members: { some: { userId: req.user.id } } }],
            },
          },
        },
      };
    }

    const comments = await prisma.comment.findMany({ where, orderBy: { id: 'asc' } });
    res.json(comments.map(commentJson));
  }),
);

commentsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    const comment = await getCommentForUser(id, req.user, 'read');
    res.json(commentJson(comment));
  }),
);

commentsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    await getCommentForUser(id, req.user, 'edit');
    const body = requiredString(req.body.body, 'body');
    const comment = await prisma.comment.update({ where: { id }, data: { body } });
    res.json(commentJson(comment));
  }),
);

commentsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    const comment = await getCommentForUser(id, req.user, 'delete');
    await prisma.comment.delete({ where: { id } });
    res.json({ id: comment.id, body: comment.body, status: 'deleted' });
  }),
);
