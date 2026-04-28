const lower = (value) => value?.toLowerCase();

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: lower(user.role),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function projectJson(project) {
  return {
    id: project.id,
    ownerId: project.ownerId,
    name: project.name,
    description: project.description,
    status: lower(project.status),
    memberCount: project._count?.members,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function taskJson(task) {
  return {
    id: task.id,
    projectId: task.projectId,
    assignedUserId: task.assignedUserId,
    title: task.title,
    description: task.description,
    priority: lower(task.priority),
    dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null,
    status: lower(task.status),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function commentJson(comment) {
  return {
    id: comment.id,
    taskId: comment.taskId,
    authorId: comment.authorId,
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}
