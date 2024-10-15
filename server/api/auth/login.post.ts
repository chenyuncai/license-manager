import { defineEventHandler, readBody, setCookie } from 'h3';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { AUTH_TOKEN_COOKIE_NAME, JWT_SECRET } from '~/server/utils/constants';

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  try {
    const user = await db.select().from(users).where(eq(users.username, username)).limit(1);

    if (user.length === 0) {
      return { error: 'User not found' };
    }

    const isPasswordValid = await bcrypt.compare(password, user[0].password);

    if (!isPasswordValid) {
      return { error: 'Invalid password' };
    }

    const token = jwt.sign({ userId: user[0].id }, JWT_SECRET, { expiresIn: '1h' });

    // Set the token in a cookie
    setCookie(event, AUTH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    });

    return { message: 'Login successful' };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Login failed' };
  }
});