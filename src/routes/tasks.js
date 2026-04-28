import { Router } from 'express';
import { asyncHandler, httpError } from '../lib/errors.js';
import { taskJson } from '../lib/formatters.js';
import { getTaskForUser, requireProjectRead, requireProjectTaskWriter } from '../lib/policies.js';
import { prisma } from '../lib/prisma.js';
import {
  enumValue,
  optionalDate,
  optionalString,
  positiveInt,
  requiredString,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../lib/validation.js';
import { isAdmin } from '../middleware/auth.js';

export const tasksRouter = Router();

async function validateAssignee(assignedUserId, projectId) {
  if (assignedUserId === undefined || assignedUserId === null || assignedUserId === '') return null;
  const userId = positiveInt(assignedUserId, 'assignedUserId');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw httpError(404, 'NOT_FOUND', 'Assigned user was not found');
  }
  const member = await prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
  if (!member) {
    throw httpError(400, 'BAD_REQUEST', 'assignedUserId must belong to the project');
  }
  return userId;
}

tasksRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const projectId = positiveInt(req.body.projectId, 'projectId');
    await requireProjectTaskWriter(projectId, req.user);
    const title = requiredString(req.body.title, 'title');
    const description = optionalString(req.body.description, 'description');
    const assignedUserId = await validateAssignee(req.body.assignedUserId, projectId);
    const priority = enumValue(req.body.priority, TASK_PRIORITIES, 'priority', 'medium');
    const status = enumValue(req.body.status, TASK_STATUSES, 'status', 'todo');
    const dueDate = optionalDate(req.body.dueDate);

    const task = await prisma.task.create({
      data: { projectId, assignedUserId, title, description, priority, status, dueDate },
    });

    res.status(201).json(taskJson(task));
  }),
);

tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {};

    if (req.query.projectId !== undefined) {
      const projectId = positiveInt(req.query.projectId, 'projectId');
      await requireProjectRead(projectId, req.user);
      where.projectId = projectId;
    } else if (!isAdmin(req.user)) {
      where.project = {
        is: {
          OR: [{ ownerId: req.user.id }, { members: { some: { userId: req.user.id } } }],
        },
      };
    }

    if (req.query.status !== undefined) {
      where.status = enumValue(req.query.status, TASK_STATUSES, 'status');
    }

    if (req.query.assignedUserId !== undefined) {
      where.assignedUserId = positiveInt(req.query.assignedUserId, 'assignedUserId');
    }

    const tasks = await prisma.task.findMany({ where, orderBy: { id: 'asc' } });
    res.json(tasks.map(taskJson));
  }),
);

tasksRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    const task = await getTaskForUser(id, req.user, 'read');
    res.json(taskJson(task));
  }),
);

tasksRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    const existing = await getTaskForUser(id, req.user, 'write');
    const data = {};

    if (req.body.title !== undefined) data.title = requiredString(req.body.title, 'title');
    if (req.body.description !== undefined) data.description = optionalString(req.body.description, 'description');
    if (req.body.assignedUserId !== undefined) {
      data.assignedUserId = await validateAssignee(req.body.assignedUserId, existing.projectId);
    }
    if (req.body.priority !== undefined) data.priority = enumValue(req.body.priority, TASK_PRIORITIES, 'priority');
    if (req.body.status !== undefined) data.status = enumValue(req.body.status, TASK_STATUSES, 'status');
    if (req.body.dueDate !== undefined) data.dueDate = optionalDate(req.body.dueDate);

    if (!Object.keys(data).length) {
      throw httpError(400, 'BAD_REQUEST', 'At least one mutable task field is required');
    }

    const task = await prisma.task.update({ where: { id }, data });
    res.json(taskJson(task));
  }),
);

tasksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    const task = await getTaskForUser(id, req.user, 'write');
    await prisma.task.delete({ where: { id } });
    res.json({ id: task.id, title: task.title, status: 'deleted' });
  }),
);
