import { Router } from 'express';
import { asyncHandler, httpError } from '../lib/errors.js';
import { projectJson } from '../lib/formatters.js';
import { requireProjectManager, requireProjectRead } from '../lib/policies.js';
import { prisma } from '../lib/prisma.js';
import { enumValue, optionalString, positiveInt, PROJECT_STATUSES, requiredString } from '../lib/validation.js';
import { isAdmin } from '../middleware/auth.js';

export const projectsRouter = Router();

projectsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = requiredString(req.body.name, 'name');
    const description = optionalString(req.body.description, 'description');
    const status = enumValue(req.body.status, PROJECT_STATUSES, 'status', 'active');

    const project = await prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          ownerId: req.user.id,
          name,
          description,
          status,
        },
      });
      await tx.projectMember.create({
        data: {
          projectId: created.id,
          userId: req.user.id,
          role: 'OWNER',
        },
      });
      return created;
    });

    res.status(201).json(projectJson(project));
  }),
);

projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = isAdmin(req.user)
      ? {}
      : {
          OR: [{ ownerId: req.user.id }, { members: { some: { userId: req.user.id } } }],
        };

    const projects = await prisma.project.findMany({ where, orderBy: { id: 'asc' } });
    res.json(projects.map(projectJson));
  }),
);

projectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    await requireProjectRead(id, req.user);
    const project = await prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { members: true } }, owner: true },
    });
    res.json(projectJson(project));
  }),
);

projectsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    await requireProjectManager(id, req.user);

    const data = {};
    if (req.body.name !== undefined) data.name = requiredString(req.body.name, 'name');
    if (req.body.description !== undefined) data.description = optionalString(req.body.description, 'description');
    if (req.body.status !== undefined) data.status = enumValue(req.body.status, PROJECT_STATUSES, 'status');

    if (!Object.keys(data).length) {
      throw httpError(400, 'BAD_REQUEST', 'At least one mutable project field is required');
    }

    const project = await prisma.project.update({ where: { id }, data });
    res.json(projectJson(project));
  }),
);

projectsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    const access = await requireProjectManager(id, req.user);
    await prisma.project.delete({ where: { id } });
    res.json({
      id: access.project.id,
      name: access.project.name,
      status: 'deleted',
    });
  }),
);

projectsRouter.post(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const id = positiveInt(req.params.id);
    await requireProjectManager(id, req.user);

    const userId = positiveInt(req.body.userId, 'userId');
    const role = enumValue(req.body.role, ['editor', 'viewer'], 'role');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw httpError(404, 'NOT_FOUND', 'User was not found');
    }

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      update: { role },
      create: { projectId: id, userId, role },
    });

    res.status(201).json({
      id: member.id,
      projectId: member.projectId,
      userId: member.userId,
      role: member.role.toLowerCase(),
    });
  }),
);
