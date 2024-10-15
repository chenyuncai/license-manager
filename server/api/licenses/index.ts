import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/db';
import { licenses } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

function generateKeyPair() {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
}

function generateActivationCode(publicKey: string, deviceId: string) {
  const data = `${deviceId}-${Date.now()}`;
  return crypto.publicEncrypt(publicKey, Buffer.from(data)).toString('base64');
}

export default defineEventHandler(async (event) => {
  const method = event.method;
  // @ts-ignore
  const userId = event.context.auth?.userId;

  if (!userId) {
    return { error: 'Unauthorized' };
  }

  // GET /api/licenses
  if (method === 'GET') {
    const userLicenses = await db.select().from(licenses).where(eq(licenses.userId, userId));
    return userLicenses.map(license => ({
      ...license,
      privateKey: undefined // Don't send private key to client
    }));
  }

  // POST /api/licenses
  if (method === 'POST') {
    const { deviceId } = await readBody(event);
    if (!deviceId) {
      return { error: 'Device ID is required' };
    }

    const { publicKey, privateKey } = generateKeyPair();
    const activationCode = generateActivationCode(publicKey, deviceId);

    const newLicense = await db.insert(licenses).values({
      userId,
      deviceId,
      publicKey,
      privateKey,
      activationCode,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    }).returning();

    return { ...newLicense[0], privateKey: undefined };
  }
});