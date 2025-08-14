import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable, coursesTable, registrationsTable } from '../db/schema';
import { type CreateRegistrationInput } from '../schema';
import { createRegistration } from '../handlers/create_registration';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  email: 'student@test.com',
  password_hash: 'hashedpassword',
  first_name: 'Test',
  last_name: 'Student',
  role: 'student' as const
};

const testStudentProfile = {
  student_id: 'STU001',
  date_of_birth: new Date('2000-01-01'),
  phone: '555-1234',
  address: '123 Test St',
  emergency_contact_name: 'Parent',
  emergency_contact_phone: '555-5678'
};

const testCourse = {
  code: 'CS101',
  name: 'Introduction to Computer Science',
  description: 'Basic computer science concepts',
  credits: 3,
  semester: 'fall' as const,
  year: 2024,
  max_enrollment: 30,
  current_enrollment: 15,
  is_active: true
};

const testInput: CreateRegistrationInput = {
  student_profile_id: 1,
  course_id: 1,
  semester: 'fall',
  year: 2024
};

describe('createRegistration', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a registration successfully', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();

    const input: CreateRegistrationInput = {
      student_profile_id: studentProfileResult[0].id,
      course_id: courseResult[0].id,
      semester: 'fall',
      year: 2024
    };

    // Create registration
    const result = await createRegistration(input);

    // Validate result
    expect(result.student_profile_id).toEqual(studentProfileResult[0].id);
    expect(result.course_id).toEqual(courseResult[0].id);
    expect(result.semester).toEqual('fall');
    expect(result.year).toEqual(2024);
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.registration_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should increment course enrollment count', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();

    const initialEnrollment = courseResult[0].current_enrollment;

    const input: CreateRegistrationInput = {
      student_profile_id: studentProfileResult[0].id,
      course_id: courseResult[0].id,
      semester: 'fall',
      year: 2024
    };

    // Create registration
    await createRegistration(input);

    // Check that enrollment was incremented
    const updatedCourse = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, courseResult[0].id))
      .execute();

    expect(updatedCourse[0].current_enrollment).toEqual(initialEnrollment + 1);
  });

  it('should save registration to database', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();

    const input: CreateRegistrationInput = {
      student_profile_id: studentProfileResult[0].id,
      course_id: courseResult[0].id,
      semester: 'fall',
      year: 2024
    };

    // Create registration
    const result = await createRegistration(input);

    // Verify it's in the database
    const registrations = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, result.id))
      .execute();

    expect(registrations).toHaveLength(1);
    expect(registrations[0].student_profile_id).toEqual(studentProfileResult[0].id);
    expect(registrations[0].course_id).toEqual(courseResult[0].id);
    expect(registrations[0].semester).toEqual('fall');
    expect(registrations[0].year).toEqual(2024);
    expect(registrations[0].status).toEqual('pending');
  });

  it('should throw error if student profile does not exist', async () => {
    // Create course but no student profile
    await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();

    const input: CreateRegistrationInput = {
      student_profile_id: 999, // Non-existent ID
      course_id: 1,
      semester: 'fall',
      year: 2024
    };

    await expect(createRegistration(input)).rejects.toThrow(/Student profile with id 999 not found/i);
  });

  it('should throw error if course does not exist', async () => {
    // Create student profile but no course
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const input: CreateRegistrationInput = {
      student_profile_id: 1,
      course_id: 999, // Non-existent ID
      semester: 'fall',
      year: 2024
    };

    await expect(createRegistration(input)).rejects.toThrow(/Course with id 999 not found/i);
  });

  it('should throw error if course is not active', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create inactive course
    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        is_active: false
      })
      .returning()
      .execute();

    const input: CreateRegistrationInput = {
      student_profile_id: studentProfileResult[0].id,
      course_id: courseResult[0].id,
      semester: 'fall',
      year: 2024
    };

    await expect(createRegistration(input)).rejects.toThrow(/Course CS101 is not currently active/i);
  });

  it('should throw error if course is full', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    // Create full course
    const courseResult = await db.insert(coursesTable)
      .values({
        ...testCourse,
        max_enrollment: 20,
        current_enrollment: 20 // Full capacity
      })
      .returning()
      .execute();

    const input: CreateRegistrationInput = {
      student_profile_id: studentProfileResult[0].id,
      course_id: courseResult[0].id,
      semester: 'fall',
      year: 2024
    };

    await expect(createRegistration(input)).rejects.toThrow(/Course CS101 is full \(20\/20\)/i);
  });

  it('should throw error if student already registered for same course in same semester/year', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();

    // Create existing registration
    await db.insert(registrationsTable)
      .values({
        student_profile_id: studentProfileResult[0].id,
        course_id: courseResult[0].id,
        semester: 'fall',
        year: 2024,
        status: 'approved'
      })
      .execute();

    const input: CreateRegistrationInput = {
      student_profile_id: studentProfileResult[0].id,
      course_id: courseResult[0].id,
      semester: 'fall',
      year: 2024
    };

    await expect(createRegistration(input)).rejects.toThrow(/Student already has a registration for course CS101 in fall 2024/i);
  });

  it('should allow registration for same course in different semester', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();

    // Create existing registration for fall
    await db.insert(registrationsTable)
      .values({
        student_profile_id: studentProfileResult[0].id,
        course_id: courseResult[0].id,
        semester: 'fall',
        year: 2024,
        status: 'approved'
      })
      .execute();

    // Try to register for spring - should succeed
    const input: CreateRegistrationInput = {
      student_profile_id: studentProfileResult[0].id,
      course_id: courseResult[0].id,
      semester: 'spring',
      year: 2024
    };

    const result = await createRegistration(input);

    expect(result.semester).toEqual('spring');
    expect(result.year).toEqual(2024);
    expect(result.status).toEqual('pending');
  });

  it('should allow registration for same course in different year', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();

    const studentProfileResult = await db.insert(studentProfilesTable)
      .values({
        ...testStudentProfile,
        user_id: userResult[0].id
      })
      .returning()
      .execute();

    const courseResult = await db.insert(coursesTable)
      .values(testCourse)
      .returning()
      .execute();

    // Create existing registration for 2024
    await db.insert(registrationsTable)
      .values({
        student_profile_id: studentProfileResult[0].id,
        course_id: courseResult[0].id,
        semester: 'fall',
        year: 2024,
        status: 'approved'
      })
      .execute();

    // Try to register for 2025 - should succeed
    const input: CreateRegistrationInput = {
      student_profile_id: studentProfileResult[0].id,
      course_id: courseResult[0].id,
      semester: 'fall',
      year: 2025
    };

    const result = await createRegistration(input);

    expect(result.semester).toEqual('fall');
    expect(result.year).toEqual(2025);
    expect(result.status).toEqual('pending');
  });
});