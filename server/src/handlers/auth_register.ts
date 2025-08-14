import { db } from '../db';
import { usersTable, studentProfilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type RegisterInput, type AuthResponse } from '../schema';

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  try {
    // Check for duplicate email
    const existingUserByEmail = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .limit(1)
      .execute();

    if (existingUserByEmail.length > 0) {
      throw new Error('Email already exists');
    }

    // Check for duplicate student ID
    const existingUserByStudentId = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.student_id, input.student_id))
      .limit(1)
      .execute();

    if (existingUserByStudentId.length > 0) {
      throw new Error('Student ID already exists');
    }

    // Hash password (using a simple hash for this example - in production use bcrypt)
    const passwordHash = await hashPassword(input.password);

    // Create user record
    const userResult = await db
      .insert(usersTable)
      .values({
        email: input.email,
        password_hash: passwordHash,
        first_name: input.first_name,
        last_name: input.last_name,
        role: 'student'
      })
      .returning()
      .execute();

    const newUser = userResult[0];

    // Create student profile record
    await db
      .insert(studentProfilesTable)
      .values({
        user_id: newUser.id,
        student_id: input.student_id,
        date_of_birth: input.date_of_birth,
        phone: input.phone || null,
        address: input.address || null,
        emergency_contact_name: input.emergency_contact_name || null,
        emergency_contact_phone: input.emergency_contact_phone || null
      })
      .execute();

    // Generate JWT token (simplified for this example)
    const token = generateJWT(newUser.id, newUser.email);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        password_hash: '', // Never return actual password hash
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at
      },
      token
    };
  } catch (error) {
    console.error('User registration failed:', error);
    throw error;
  }
}

// Simple password hashing function (in production, use bcrypt)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt'); // Add salt in production
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Simple JWT generation (in production, use proper JWT library)
function generateJWT(userId: number, email: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: userId.toString(), 
    email, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }));
  const signature = btoa('mock-signature'); // In production, use proper HMAC signing
  return `${header}.${payload}.${signature}`;
}