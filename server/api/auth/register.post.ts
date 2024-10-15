import { defineEventHandler, readBody } from 'h3';
import { db } from '~/server/db';
import { users } from '~/server/db/schema';
import bcrypt from 'bcrypt';

export default defineEventHandler(async (event) => {
  const { username, password } = await readBody(event);

  if (!username || !password) {
    return { error: 'Username and password are required' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await db.insert(users).values({
      username,
      password: hashedPassword,
    }).returning({ id: users.id, username: users.username });

    return { message: 'User registered successfully', user: newUser[0] };
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'Username already exists or registration failed' };
  }
});