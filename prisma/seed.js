import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const password = 'Password123!';

async function createUser(email, displayName, role = 'USER') {
  return prisma.user.create({
    data: {
      email,
      displayName,
      role,
      passwordHash: await bcrypt.hash(password, 12),
    },
  });
}

async function main() {
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const admin = await createUser('admin@example.com', 'Ada Admin', 'ADMIN');
  const owner = await createUser('owner@example.com', 'Olivia Owner');
  const editor = await createUser('editor@example.com', 'Evan Editor');
  const viewer = await createUser('viewer@example.com', 'Vera Viewer');
  const outsider = await createUser('outsider@example.com', 'Owen Outsider');

  const sprint = await prisma.project.create({
    data: {
      ownerId: owner.id,
      name: 'Senior Design Sprint',
      description: 'Shared planning board for sprint work',
      status: 'ACTIVE',
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: editor.id, role: 'EDITOR' },
          { userId: viewer.id, role: 'VIEWER' },
        ],
      },
    },
  });

  const privateProject = await prisma.project.create({
    data: {
      ownerId: outsider.id,
      name: 'Private Launch Plan',
      description: 'Project visible only to its owner and admins',
      status: 'ACTIVE',
      members: {
        create: [{ userId: outsider.id, role: 'OWNER' }],
      },
    },
  });

  const archived = await prisma.project.create({
    data: {
      ownerId: owner.id,
      name: 'Archived API Refactor',
      description: 'Completed project kept for history',
      status: 'ARCHIVED',
      members: {
        create: [
          { userId: owner.id, role: 'OWNER' },
          { userId: editor.id, role: 'EDITOR' },
        ],
      },
    },
  });

  const loginTask = await prisma.task.create({
    data: {
      projectId: sprint.id,
      assignedUserId: editor.id,
      title: 'Build login middleware',
      description: 'Create middleware for JWT verification',
      priority: 'HIGH',
      dueDate: new Date('2026-05-15T00:00:00.000Z'),
      status: 'TODO',
    },
  });

  await prisma.task.create({
    data: {
      projectId: sprint.id,
      assignedUserId: owner.id,
      title: 'Document auth errors',
      description: 'Write Swagger examples for authentication and authorization failures',
      priority: 'MEDIUM',
      dueDate: new Date('2026-05-20T00:00:00.000Z'),
      status: 'IN_PROGRESS',
    },
  });

  await prisma.task.create({
    data: {
      projectId: privateProject.id,
      assignedUserId: outsider.id,
      title: 'Draft launch checklist',
      description: 'Private task used to test forbidden access',
      priority: 'LOW',
      status: 'TODO',
    },
  });

  await prisma.task.create({
    data: {
      projectId: archived.id,
      title: 'Archive completed tickets',
      description: 'Confirm completed tickets are retained',
      priority: 'LOW',
      status: 'DONE',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: loginTask.id,
      authorId: owner.id,
      body: 'I finished the token verification middleware and started testing.',
    },
  });

  await prisma.comment.create({
    data: {
      taskId: loginTask.id,
      authorId: editor.id,
      body: 'I will review the middleware edge cases tonight.',
    },
  });

  console.log('Seed complete. Known password for all users:', password);
  console.log('Seed users:', {
    admin: admin.email,
    owner: owner.email,
    editor: editor.email,
    viewer: viewer.email,
    outsider: outsider.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
