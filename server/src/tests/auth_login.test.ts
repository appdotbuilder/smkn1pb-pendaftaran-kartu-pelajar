import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/auth_login';
import { eq } from 'drizzle-orm';

// Test user data
const testUserData = {
  email: 'john.doe@example.com',
  password: 'securepassword123',
  first_name: 'John',
  last_name: 'Doe',
  role: 'student' as const
};

const validLoginInput: LoginInput = {
  email: testUserData.email,
  password: testUserData.password
};

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully authenticate valid user credentials', async () => {
    // Create a test user (using plain password for simplicity in this environment)
    const insertResult = await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: testUserData.password, // In production, this would be hashed
        first_name: testUserData.first_name,
        last_name: testUserData.last_name,
        role: testUserData.role
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    const result = await loginUser(validLoginInput);

    // Verify response structure
    expect(result.user).toBeDefined();
    expect(result.token).toBeDefined();
    
    // Verify user data
    expect(result.user.id).toEqual(createdUser.id);
    expect(result.user.email).toEqual(testUserData.email);
    expect(result.user.first_name).toEqual(testUserData.first_name);
    expect(result.user.last_name).toEqual(testUserData.last_name);
    expect(result.user.role).toEqual(testUserData.role);
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    
    // Verify token is provided
    expect(typeof result.token).toBe('string');
    expect(result.token!.length).toBeGreaterThan(0);
  });

  it('should reject login with incorrect password', async () => {
    // Create a test user
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: testUserData.password,
        first_name: testUserData.first_name,
        last_name: testUserData.last_name,
        role: testUserData.role
      })
      .execute();

    const invalidPasswordInput: LoginInput = {
      email: testUserData.email,
      password: 'wrongpassword'
    };

    await expect(loginUser(invalidPasswordInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should reject login with non-existent email', async () => {
    const nonExistentEmailInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword'
    };

    await expect(loginUser(nonExistentEmailInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle admin user login correctly', async () => {
    // Create an admin user
    const insertResult = await db.insert(usersTable)
      .values({
        email: 'admin@example.com',
        password_hash: testUserData.password,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      })
      .returning()
      .execute();

    const adminLoginInput: LoginInput = {
      email: 'admin@example.com',
      password: testUserData.password
    };

    const result = await loginUser(adminLoginInput);

    expect(result.user.role).toEqual('admin');
    expect(result.user.email).toEqual('admin@example.com');
    expect(result.user.first_name).toEqual('Admin');
    expect(result.user.last_name).toEqual('User');
  });

  it('should handle empty password correctly', async () => {
    // Create a test user
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: testUserData.password,
        first_name: testUserData.first_name,
        last_name: testUserData.last_name,
        role: testUserData.role
      })
      .execute();

    const emptyPasswordInput: LoginInput = {
      email: testUserData.email,
      password: ''
    };

    await expect(loginUser(emptyPasswordInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should verify user exists in database after successful login', async () => {
    // Create a test user
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: testUserData.password,
        first_name: testUserData.first_name,
        last_name: testUserData.last_name,
        role: testUserData.role
      })
      .execute();

    const result = await loginUser(validLoginInput);

    // Verify the user actually exists in database
    const dbUsers = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(dbUsers).toHaveLength(1);
    expect(dbUsers[0].email).toEqual(testUserData.email);
    expect(dbUsers[0].first_name).toEqual(testUserData.first_name);
    expect(dbUsers[0].role).toEqual(testUserData.role);
  });

  it('should return consistent user data structure', async () => {
    // Create a test user
    const insertResult = await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: testUserData.password,
        first_name: testUserData.first_name,
        last_name: testUserData.last_name,
        role: testUserData.role
      })
      .returning()
      .execute();

    const result = await loginUser(validLoginInput);

    // Verify all expected fields are present
    expect(result.user.id).toBeDefined();
    expect(result.user.email).toBeDefined();
    expect(result.user.password_hash).toBeDefined();
    expect(result.user.first_name).toBeDefined();
    expect(result.user.last_name).toBeDefined();
    expect(result.user.role).toBeDefined();
    expect(result.user.created_at).toBeDefined();
    expect(result.user.updated_at).toBeDefined();

    // Verify types
    expect(typeof result.user.id).toBe('number');
    expect(typeof result.user.email).toBe('string');
    expect(typeof result.user.password_hash).toBe('string');
    expect(typeof result.user.first_name).toBe('string');
    expect(typeof result.user.last_name).toBe('string');
    expect(['student', 'admin']).toContain(result.user.role);
  });
});