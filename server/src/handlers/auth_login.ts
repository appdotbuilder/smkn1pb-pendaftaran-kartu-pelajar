import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type AuthResponse } from '../schema';
import { eq } from 'drizzle-orm';

// Simple password verification function (in production, use bcrypt)
const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  // For this implementation, we'll use a simple string comparison
  // In production, this should use bcrypt.compare()
  return plainPassword === hashedPassword;
};

export const loginUser = async (input: LoginInput): Promise<AuthResponse> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = users[0];

    // Verify password (simplified for this environment)
    const isValidPassword = await verifyPassword(input.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Return complete user object as expected by the schema
    return {
      user: {
        id: user.id,
        email: user.email,
        password_hash: user.password_hash,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token: 'jwt-token-placeholder' // In a real app, generate a proper JWT token here
    };
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};