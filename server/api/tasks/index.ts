import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/db';
import { tasks } from '~/server/db/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const method = event.method;
  // @ts-ignore
  const userId = event.context.auth?.userId;

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // GET /api/tasks
  if (method === 'GET') {
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
    return userTasks;
  }

  // POST /api/tasks
  if (method === 'POST') {
    const body = await readBody(event);
    const newTask = await db.insert(tasks).values({
      title: body.title,
      userId: userId,
    }).returning();
    return newTask[0];
  }
});