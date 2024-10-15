import { defineEventHandler, getCookie } from 'h3';
import jwt from 'jsonwebtoken';
import { AUTH_TOKEN_COOKIE_NAME, JWT_SECRET } from '~/server/utils/constants';

export default defineEventHandler((event) => {
  const token = getCookie(event, AUTH_TOKEN_COOKIE_NAME);

  if (!token) {
    return { error: 'No token provided' };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // @ts-ignore
    event.context.auth = decoded;
  } catch (error) {
    return { error: 'Invalid token' };
  }
});