import { defineEventHandler, readBody, getRouterParam } from 'h3';
import { db } from '~/server/db';
import { tasks } from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') as string);
  const method = event.method;
  // @ts-ignore
  const userId = event.context.auth?.userId;

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // GET /api/tasks/:id
  if (method === 'GET') {
    const task = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1);
    return task[0] || { error: 'Task not found' };
  }

  // PUT /api/tasks/:id
  if (method === 'PUT') {
    const body = await readBody(event);
    const updatedTask = await db.update(tasks)
      .set({ ...body })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return updatedTask[0] || { error: 'Task not found' };
  }

  // DELETE /api/tasks/:id
  if (method === 'DELETE') {
    const deletedTask = await db.delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    return deletedTask[0] ? { message: 'Task deleted', task: deletedTask[0] } : { error: 'Task not found' };
  }
});