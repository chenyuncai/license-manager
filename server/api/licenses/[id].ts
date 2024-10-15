import { defineEventHandler, readBody, getRouterParam } from 'h3';
import { db } from '~/server/db';
import { licenses } from '~/server/db/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') as string);
  const method = event.method;
  // @ts-ignore
  const userId = event.context.auth?.userId;

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // GET /api/licenses/:id
  if (method === 'GET') {
    const license = await db.select().from(licenses).where(and(eq(licenses.id, id), eq(licenses.userId, userId))).limit(1);
    if (license.length === 0) {
      return { error: 'License not found' };
    }
    return { ...license[0], privateKey: undefined };
  }

  // PUT /api/licenses/:id
  if (method === 'PUT') {
    const { isActive, expiresAt } = await readBody(event);
    const updatedLicense = await db.update(licenses)
      .set({ isActive, expiresAt: new Date(expiresAt) })
      .where(and(eq(licenses.id, id), eq(licenses.userId, userId)))
      .returning();
    if (updatedLicense.length === 0) {
      return { error: 'License not found' };
    }
    return { ...updatedLicense[0], privateKey: undefined };
  }

  // DELETE /api/licenses/:id
  if (method === 'DELETE') {
    const deletedLicense = await db.delete(licenses)
      .where(and(eq(licenses.id, id), eq(licenses.userId, userId)))
      .returning();
    if (deletedLicense.length === 0) {
      return { error: 'License not found' };
    }
    return { message: 'License deleted', license: { ...deletedLicense[0], privateKey: undefined } };
  }
});