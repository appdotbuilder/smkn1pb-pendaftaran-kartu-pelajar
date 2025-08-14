import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type RegisterInput } from '../schema';
import { registerUser } from '../handlers/auth_register';

// Test input with all fields
const testInput: RegisterInput = {
  email: 'student@test.com',
  password: 'password123',
  first_name: 'John',
  last_name: 'Doe',
  student_id: 'STU001',
  date_of_birth: new Date('1995-01-15'),
  phone: '555-0123',
  address: '123 Test St',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '555-0456'
};

// Minimal test input (optional fields omitted)
const minimalTestInput: RegisterInput = {
  email: 'minimal@test.com',
  password: 'password123',
  first_name: 'Jane',
  last_name: 'Smith',
  student_id: 'STU002',
  date_of_birth: new Date('1996-03-20')
};

describe('registerUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should register a new user with complete profile', async () => {
    const result = await registerUser(testInput);

    // Validate user data
    expect(result.user.email).toEqual('student@test.com');
    expect(result.user.first_name).toEqual('John');
    expect(result.user.last_name).toEqual('Doe');
    expect(result.user.role).toEqual('student');
    expect(result.user.id).toBeDefined();
    expect(result.user.created_at).toBeInstanceOf(Date);
    expect(result.user.updated_at).toBeInstanceOf(Date);
    expect(result.user.password_hash).toEqual(''); // Should not return hash
    expect(result.token).toBeDefined();
    expect(typeof result.token).toBe('string');
  });

  it('should register a user with minimal profile data', async () => {
    const result = await registerUser(minimalTestInput);

    // Validate basic user data
    expect(result.user.email).toEqual('minimal@test.com');
    expect(result.user.first_name).toEqual('Jane');
    expect(result.user.last_name).toEqual('Smith');
    expect(result.user.role).toEqual('student');
    expect(result.token).toBeDefined();
  });

  it('should save user to database correctly', async () => {
    const result = await registerUser(testInput);

    // Query user from database
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    const user = users[0];
    expect(user.email).toEqual('student@test.com');
    expect(user.first_name).toEqual('John');
    expect(user.last_name).toEqual('Doe');
    expect(user.role).toEqual('student');
    expect(user.password_hash).not.toEqual(''); // Should have hashed password
    expect(user.password_hash).not.toEqual('password123'); // Should not be plain text
  });

  it('should save student profile to database correctly', async () => {
    const result = await registerUser(testInput);

    // Query student profile from database
    const profiles = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.user_id, result.user.id))
      .execute();

    expect(profiles).toHaveLength(1);
    const profile = profiles[0];
    expect(profile.student_id).toEqual('STU001');
    expect(profile.date_of_birth).toBeInstanceOf(Date);
    expect(profile.phone).toEqual('555-0123');
    expect(profile.address).toEqual('123 Test St');
    expect(profile.emergency_contact_name).toEqual('Jane Doe');
    expect(profile.emergency_contact_phone).toEqual('555-0456');
  });

  it('should save student profile with null optional fields', async () => {
    const result = await registerUser(minimalTestInput);

    // Query student profile from database
    const profiles = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.user_id, result.user.id))
      .execute();

    expect(profiles).toHaveLength(1);
    const profile = profiles[0];
    expect(profile.student_id).toEqual('STU002');
    expect(profile.date_of_birth).toBeInstanceOf(Date);
    expect(profile.phone).toBeNull();
    expect(profile.address).toBeNull();
    expect(profile.emergency_contact_name).toBeNull();
    expect(profile.emergency_contact_phone).toBeNull();
  });

  it('should reject duplicate email', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register another user with same email
    const duplicateInput = {
      ...testInput,
      student_id: 'STU999' // Different student ID
    };

    await expect(registerUser(duplicateInput)).rejects.toThrow(/email already exists/i);
  });

  it('should reject duplicate student ID', async () => {
    // Register first user
    await registerUser(testInput);

    // Try to register another user with same student ID
    const duplicateInput = {
      ...testInput,
      email: 'different@test.com' // Different email
    };

    await expect(registerUser(duplicateInput)).rejects.toThrow(/student id already exists/i);
  });

  it('should handle date_of_birth as Date object', async () => {
    const inputWithDateString = {
      ...testInput,
      date_of_birth: new Date('1997-12-25')
    };

    const result = await registerUser(inputWithDateString);

    // Query student profile to verify date was saved correctly
    const profiles = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.user_id, result.user.id))
      .execute();

    expect(profiles[0].date_of_birth).toBeInstanceOf(Date);
    expect(profiles[0].date_of_birth.getFullYear()).toEqual(1997);
    expect(profiles[0].date_of_birth.getMonth()).toEqual(11); // December (0-based)
    expect(profiles[0].date_of_birth.getDate()).toEqual(25);
  });

  it('should generate valid JWT token format', async () => {
    const result = await registerUser(testInput);

    // JWT should have 3 parts separated by dots
    const tokenParts = result.token!.split('.');
    expect(tokenParts).toHaveLength(3);

    // Each part should be base64 encoded
    tokenParts.forEach(part => {
      expect(part.length).toBeGreaterThan(0);
      expect(() => atob(part)).not.toThrow();
    });

    // Decode and verify payload structure
    const payload = JSON.parse(atob(tokenParts[1]));
    expect(payload.sub).toEqual(result.user.id.toString());
    expect(payload.email).toEqual(testInput.email);
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it('should create user and profile in transaction-like manner', async () => {
    const result = await registerUser(testInput);

    // Verify both user and student profile exist
    const users = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, result.user.id))
      .execute();

    const profiles = await db
      .select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.user_id, result.user.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].user_id).toEqual(users[0].id);
  });
});