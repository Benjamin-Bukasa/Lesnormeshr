const prisma = require('../lib/prisma');
const AppError = require('../utils/app-error');

function serializeTask(task) {
  return {
    id: task.id,
    label: task.title,
    category: task.category || 'Operations RH',
    dueAt: task.dueAt,
    done: Boolean(task.completedAt),
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

function serializeNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    readAt: notification.readAt,
    createdAt: notification.createdAt,
  };
}

function serializeMessage(message) {
  return {
    id: message.id,
    title: message.title,
    message: message.message,
    sender: message.sender
      ? {
          id: message.sender.id,
          name: `${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim(),
        }
      : null,
    readAt: message.readAt,
    createdAt: message.createdAt,
  };
}

async function getWorkspaceSummary({ userId, tenantId }) {
  const [tasks, notifications, messages] = await Promise.all([
    prisma.workspaceTask.findMany({
      where: {
        tenantId,
        assigneeId: userId,
      },
      orderBy: [
        { completedAt: 'asc' },
        { dueAt: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 100,
    }),
    prisma.userNotification.findMany({
      where: {
        tenantId,
        userId,
        readAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.userMessage.findMany({
      where: {
        tenantId,
        recipientId: userId,
        readAt: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  return {
    tasks: tasks.map(serializeTask),
    notifications: notifications.map(serializeNotification),
    messages: messages.map(serializeMessage),
  };
}

async function updateWorkspaceTask(taskId, payload, { userId, tenantId }) {
  const task = await prisma.workspaceTask.findFirst({
    where: {
      id: taskId,
      tenantId,
      assigneeId: userId,
    },
  });

  if (!task) {
    throw new AppError(404, 'Tache introuvable.');
  }

  const completed = Boolean(payload.done);
  const updatedTask = await prisma.workspaceTask.update({
    where: { id: task.id },
    data: {
      completedAt: completed ? new Date() : null,
    },
  });

  return serializeTask(updatedTask);
}

async function clearCompletedWorkspaceTasks({ userId, tenantId }) {
  await prisma.workspaceTask.deleteMany({
    where: {
      tenantId,
      assigneeId: userId,
      completedAt: { not: null },
    },
  });
}

async function markNotificationsRead({ userId, tenantId }) {
  await prisma.userNotification.updateMany({
    where: {
      tenantId,
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

async function markMessagesRead({ userId, tenantId }) {
  await prisma.userMessage.updateMany({
    where: {
      tenantId,
      recipientId: userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });
}

module.exports = {
  clearCompletedWorkspaceTasks,
  getWorkspaceSummary,
  markMessagesRead,
  markNotificationsRead,
  updateWorkspaceTask,
};
