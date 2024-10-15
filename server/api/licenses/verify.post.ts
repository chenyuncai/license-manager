import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/db';
import { licenses } from '~/server/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
  const { activationCode, deviceId } = await readBody(event);

  if (!activationCode || !deviceId) {
    return { error: 'Activation code and device ID are required' };
  }

  const license = await db.select().from(licenses).where(eq(licenses.activationCode, activationCode)).limit(1);

  if (license.length === 0) {
    return { error: 'Invalid activation code' };
  }

  const { publicKey, privateKey, isActive, expiresAt } = license[0];

  if (!isActive) {
    return { error: 'License is not active' };
  }

  if (new Date(expiresAt) < new Date()) {
    return { error: 'License has expired' };
  }

  try {
    const decrypted = crypto.privateDecrypt(privateKey, Buffer.from(activationCode, 'base64')).toString();
    const [licenseDeviceId, timestamp] = decrypted.split('-');

    if (licenseDeviceId !== deviceId) {
      return { error: 'Invalid device ID' };
    }

    return { message: 'License verified successfully', isValid: true };
  } catch (error) {
    console.error('License verification error:', error);
    return { error: 'Invalid activation code', isValid: false };
  }
});