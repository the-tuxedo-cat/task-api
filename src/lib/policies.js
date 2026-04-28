import { httpError } from './errors.js';
import { prisma } from './prisma.js';
import { isAdmin } from '../middleware/auth.js';

export async function getProjectAccess(projectId, user) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      members: { where: { userId: user.id } },
    },
  });

  if (!project) {
    throw httpError(404, 'NOT_FOUND', 'Project was not found');
  }

  const membership = project.members[0];
  const owner = project.ownerId === user.id;
  return {
    project,
    membership,
    canRead: isAdmin(user) || owner || Boolean(membership),
    canWriteTasks: isAdmin(user) || owner || membership?.role === 'EDITOR' || membership?.role === 'OWNER',
    canManageProject: isAdmin(user) || owner,
    isOwner: owner,
  };
}

export async function requireProjectRead(projectId, user) {
  const access = await getProjectAccess(projectId, user);
  if (!access.canRead) {
    throw httpError(403, 'FORBIDDEN', 'You do not have access to this project');
  }
  return access;
}

export async function requireProjectManager(projectId, user) {
  const access = await getProjectAccess(projectId, user);
  if (!access.canManageProject) {
    throw httpError(403, 'FORBIDDEN', 'Only the project owner or an admin can perform this action');
  }
  return access;
}

export async function requireProjectTaskWriter(projectId, user) {
  const access = await getProjectAccess(projectId, user);
  if (!access.canWriteTasks) {
    throw httpError(403, 'FORBIDDEN', 'You do not have write access to this project');
  }
  return access;
}

export async function getTaskForUser(taskId, user, mode = 'read') {
  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { project: true } });
  if (!task) {
    throw httpError(404, 'NOT_FOUND', 'Task was not found');
  }
  if (mode === 'write') {
    await requireProjectTaskWriter(task.projectId, user);
  } else {
    await requireProjectRead(task.projectId, user);
  }
  return task;
}

export async function getCommentForUser(commentId, user, mode = 'read') {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { task: { include: { project: true } } },
  });

  if (!comment) {
    throw httpError(404, 'NOT_FOUND', 'Comment was not found');
  }

  if (mode === 'edit') {
    if (!isAdmin(user) && comment.authorId !== user.id) {
      throw httpError(403, 'FORBIDDEN', 'Only the comment author or an admin can edit this comment');
    }
    return comment;
  }

  if (mode === 'delete') {
    const access = await getProjectAccess(comment.task.projectId, user);
    if (!isAdmin(user) && comment.authorId !== user.id && !access.isOwner) {
      throw httpError(403, 'FORBIDDEN', 'Only the comment author, project owner, or an admin can delete this comment');
    }
    return comment;
  }

  await requireProjectRead(comment.task.projectId, user);
  return comment;
}
