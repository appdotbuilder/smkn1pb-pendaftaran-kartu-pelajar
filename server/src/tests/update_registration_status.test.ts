import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable, coursesTable, registrationsTable } from '../db/schema';
import { type UpdateRegistrationStatusInput } from '../schema';
import { updateRegistrationStatus } from '../handlers/update_registration_status';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'student@test.com',
  password_hash: 'hashed_password',
  first_name: 'John',
  last_name: 'Doe',
  role: 'student' as const
};

const testStudentProfile = {
  user_id: 1,
  student_id: 'STU001',
  date_of_birth: new Date('2000-01-01'),
  phone: '123-456-7890',
  address: '123 Test St',
  emergency_contact_name: 'Jane Doe',
  emergency_contact_phone: '987-654-3210'
};

const testCourse = {
  code: 'CS101',
  name: 'Introduction to Computer Science',
  description: 'Basic programming concepts',
  credits: 3,
  semester: 'fall' as const,
  year: 2024,
  max_enrollment: 2,
  current_enrollment: 0,
  is_active: true
};

const testRegistration = {
  student_profile_id: 1,
  course_id: 1,
  semester: 'fall' as const,
  year: 2024,
  status: 'pending' as const
};

describe('updateRegistrationStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update registration status from pending to approved', async () => {
    // Create prerequisites
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(studentProfilesTable).values(testStudentProfile).execute();
    await db.insert(coursesTable).values(testCourse).execute();
    await db.insert(registrationsTable).values(testRegistration).execute();

    const input: UpdateRegistrationStatusInput = {
      id: 1,
      status: 'approved'
    };

    const result = await updateRegistrationStatus(input);

    expect(result.id).toBe(1);
    expect(result.status).toBe('approved');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should increment course enrollment when approving registration', async () => {
    // Create prerequisites
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(studentProfilesTable).values(testStudentProfile).execute();
    await db.insert(coursesTable).values(testCourse).execute();
    await db.insert(registrationsTable).values(testRegistration).execute();

    const input: UpdateRegistrationStatusInput = {
      id: 1,
      status: 'approved'
    };

    await updateRegistrationStatus(input);

    // Check course enrollment was incremented
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, 1))
      .execute();

    expect(courses[0].current_enrollment).toBe(1);
  });

  it('should decrement course enrollment when changing from approved to rejected', async () => {
    // Create prerequisites with approved registration
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(studentProfilesTable).values(testStudentProfile).execute();
    await db.insert(coursesTable).values({ ...testCourse, current_enrollment: 1 }).execute();
    await db.insert(registrationsTable).values({ ...testRegistration, status: 'approved' }).execute();

    const input: UpdateRegistrationStatusInput = {
      id: 1,
      status: 'rejected'
    };

    await updateRegistrationStatus(input);

    // Check course enrollment was decremented
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, 1))
      .execute();

    expect(courses[0].current_enrollment).toBe(0);
  });

  it('should decrement course enrollment when changing from approved to withdrawn', async () => {
    // Create prerequisites with approved registration
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(studentProfilesTable).values(testStudentProfile).execute();
    await db.insert(coursesTable).values({ ...testCourse, current_enrollment: 1 }).execute();
    await db.insert(registrationsTable).values({ ...testRegistration, status: 'approved' }).execute();

    const input: UpdateRegistrationStatusInput = {
      id: 1,
      status: 'withdrawn'
    };

    await updateRegistrationStatus(input);

    // Check course enrollment was decremented
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, 1))
      .execute();

    expect(courses[0].current_enrollment).toBe(0);
  });

  it('should reject approval when course is at maximum enrollment', async () => {
    // Create prerequisites with course at max capacity
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(studentProfilesTable).values(testStudentProfile).execute();
    await db.insert(coursesTable).values({ ...testCourse, current_enrollment: 2, max_enrollment: 2 }).execute();
    await db.insert(registrationsTable).values(testRegistration).execute();

    const input: UpdateRegistrationStatusInput = {
      id: 1,
      status: 'approved'
    };

    await expect(updateRegistrationStatus(input)).rejects.toThrow(/reached maximum enrollment capacity/i);
  });

  it('should not change enrollment when status remains the same', async () => {
    // Create prerequisites
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(studentProfilesTable).values(testStudentProfile).execute();
    await db.insert(coursesTable).values(testCourse).execute();
    await db.insert(registrationsTable).values(testRegistration).execute();

    const input: UpdateRegistrationStatusInput = {
      id: 1,
      status: 'pending'
    };

    const result = await updateRegistrationStatus(input);

    expect(result.status).toBe('pending');

    // Check course enrollment unchanged
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, 1))
      .execute();

    expect(courses[0].current_enrollment).toBe(0);
  });

  it('should not change enrollment when changing from pending to rejected', async () => {
    // Create prerequisites
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(studentProfilesTable).values(testStudentProfile).execute();
    await db.insert(coursesTable).values(testCourse).execute();
    await db.insert(registrationsTable).values(testRegistration).execute();

    const input: UpdateRegistrationStatusInput = {
      id: 1,
      status: 'rejected'
    };

    await updateRegistrationStatus(input);

    // Check course enrollment unchanged
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, 1))
      .execute();

    expect(courses[0].current_enrollment).toBe(0);
  });

  it('should throw error when registration not found', async () => {
    const input: UpdateRegistrationStatusInput = {
      id: 999,
      status: 'approved'
    };

    await expect(updateRegistrationStatus(input)).rejects.toThrow(/Registration with id 999 not found/i);
  });

  it('should handle changing from rejected to approved', async () => {
    // Create prerequisites with rejected registration
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(studentProfilesTable).values(testStudentProfile).execute();
    await db.insert(coursesTable).values(testCourse).execute();
    await db.insert(registrationsTable).values({ ...testRegistration, status: 'rejected' }).execute();

    const input: UpdateRegistrationStatusInput = {
      id: 1,
      status: 'approved'
    };

    const result = await updateRegistrationStatus(input);

    expect(result.status).toBe('approved');

    // Check course enrollment was incremented
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, 1))
      .execute();

    expect(courses[0].current_enrollment).toBe(1);
  });
});