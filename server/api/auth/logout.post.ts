import { defineEventHandler, setCookie } from 'h3';
import { AUTH_TOKEN_COOKIE_NAME } from '~/server/utils/constants';

export default defineEventHandler(async (event) => {
  // Clear the auth_token cookie
  setCookie(event, AUTH_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0, // Expire immediately
    path: '/'
  });

  return { message: 'Logout successful' };
});