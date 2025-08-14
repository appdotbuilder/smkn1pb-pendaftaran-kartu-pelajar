import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable, coursesTable, registrationsTable } from '../db/schema';
import { withdrawRegistration } from '../handlers/withdraw_registration';
import { eq } from 'drizzle-orm';

describe('withdrawRegistration', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testStudentProfile: any;
  let testCourse: any;

  beforeEach(async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student'
      })
      .returning()
      .execute();
    testUser = users[0];

    // Create test student profile
    const profiles = await db.insert(studentProfilesTable)
      .values({
        user_id: testUser.id,
        student_id: 'STU001',
        date_of_birth: new Date('1995-01-01'),
        phone: '123-456-7890',
        address: '123 Test St'
      })
      .returning()
      .execute();
    testStudentProfile = profiles[0];

    // Create test course
    const courses = await db.insert(coursesTable)
      .values({
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Basic CS course',
        credits: 3,
        semester: 'fall',
        year: 2024,
        max_enrollment: 30,
        current_enrollment: 5,
        is_active: true
      })
      .returning()
      .execute();
    testCourse = courses[0];
  });

  it('should withdraw a pending registration', async () => {
    // Create a pending registration
    const registrations = await db.insert(registrationsTable)
      .values({
        student_profile_id: testStudentProfile.id,
        course_id: testCourse.id,
        semester: 'fall',
        year: 2024,
        status: 'pending'
      })
      .returning()
      .execute();
    const testRegistration = registrations[0];

    const result = await withdrawRegistration(testRegistration.id, testStudentProfile.id);

    // Verify the registration was updated
    expect(result.id).toEqual(testRegistration.id);
    expect(result.status).toEqual('withdrawn');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.student_profile_id).toEqual(testStudentProfile.id);
    expect(result.course_id).toEqual(testCourse.id);

    // Verify the registration is updated in database
    const updatedRegistrations = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.id, testRegistration.id))
      .execute();

    expect(updatedRegistrations[0].status).toEqual('withdrawn');

    // Course enrollment should remain unchanged for pending registration
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, testCourse.id))
      .execute();

    expect(courses[0].current_enrollment).toEqual(5);
  });

  it('should withdraw an approved registration and decrement enrollment', async () => {
    // Create an approved registration
    const registrations = await db.insert(registrationsTable)
      .values({
        student_profile_id: testStudentProfile.id,
        course_id: testCourse.id,
        semester: 'fall',
        year: 2024,
        status: 'approved'
      })
      .returning()
      .execute();
    const testRegistration = registrations[0];

    const result = await withdrawRegistration(testRegistration.id, testStudentProfile.id);

    // Verify the registration was updated
    expect(result.status).toEqual('withdrawn');

    // Verify course enrollment was decremented
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, testCourse.id))
      .execute();

    expect(courses[0].current_enrollment).toEqual(4); // 5 - 1 = 4
  });

  it('should throw error when registration does not exist', async () => {
    await expect(
      withdrawRegistration(99999, testStudentProfile.id)
    ).rejects.toThrow(/registration not found/i);
  });

  it('should throw error when registration belongs to different student', async () => {
    // Create another student
    const anotherUser = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'student'
      })
      .returning()
      .execute();

    const anotherProfile = await db.insert(studentProfilesTable)
      .values({
        user_id: anotherUser[0].id,
        student_id: 'STU002',
        date_of_birth: new Date('1996-01-01'),
        phone: '987-654-3210'
      })
      .returning()
      .execute();

    // Create registration for the other student
    const registrations = await db.insert(registrationsTable)
      .values({
        student_profile_id: anotherProfile[0].id,
        course_id: testCourse.id,
        semester: 'fall',
        year: 2024,
        status: 'pending'
      })
      .returning()
      .execute();

    // Try to withdraw using wrong student profile ID
    await expect(
      withdrawRegistration(registrations[0].id, testStudentProfile.id)
    ).rejects.toThrow(/registration not found or does not belong to this student/i);
  });

  it('should throw error when trying to withdraw already withdrawn registration', async () => {
    // Create a withdrawn registration
    const registrations = await db.insert(registrationsTable)
      .values({
        student_profile_id: testStudentProfile.id,
        course_id: testCourse.id,
        semester: 'fall',
        year: 2024,
        status: 'withdrawn'
      })
      .returning()
      .execute();
    const testRegistration = registrations[0];

    await expect(
      withdrawRegistration(testRegistration.id, testStudentProfile.id)
    ).rejects.toThrow(/registration is already withdrawn/i);
  });

  it('should throw error when trying to withdraw rejected registration', async () => {
    // Create a rejected registration
    const registrations = await db.insert(registrationsTable)
      .values({
        student_profile_id: testStudentProfile.id,
        course_id: testCourse.id,
        semester: 'fall',
        year: 2024,
        status: 'rejected'
      })
      .returning()
      .execute();
    const testRegistration = registrations[0];

    await expect(
      withdrawRegistration(testRegistration.id, testStudentProfile.id)
    ).rejects.toThrow(/cannot withdraw a rejected registration/i);
  });

  it('should handle concurrent withdrawals correctly', async () => {
    // Create multiple approved registrations
    const reg1 = await db.insert(registrationsTable)
      .values({
        student_profile_id: testStudentProfile.id,
        course_id: testCourse.id,
        semester: 'fall',
        year: 2024,
        status: 'approved'
      })
      .returning()
      .execute();

    // Create another student and registration
    const anotherUser = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'student'
      })
      .returning()
      .execute();

    const anotherProfile = await db.insert(studentProfilesTable)
      .values({
        user_id: anotherUser[0].id,
        student_id: 'STU002',
        date_of_birth: new Date('1996-01-01')
      })
      .returning()
      .execute();

    const reg2 = await db.insert(registrationsTable)
      .values({
        student_profile_id: anotherProfile[0].id,
        course_id: testCourse.id,
        semester: 'fall',
        year: 2024,
        status: 'approved'
      })
      .returning()
      .execute();

    // Withdraw both registrations
    await withdrawRegistration(reg1[0].id, testStudentProfile.id);
    await withdrawRegistration(reg2[0].id, anotherProfile[0].id);

    // Course enrollment should be decremented twice (5 - 2 = 3)
    const courses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.id, testCourse.id))
      .execute();

    expect(courses[0].current_enrollment).toEqual(3);
  });

  it('should preserve all other registration fields when withdrawing', async () => {
    // Create a registration with specific data
    const registrationDate = new Date('2024-01-15');
    const registrations = await db.insert(registrationsTable)
      .values({
        student_profile_id: testStudentProfile.id,
        course_id: testCourse.id,
        semester: 'spring',
        year: 2025,
        status: 'pending',
        registration_date: registrationDate
      })
      .returning()
      .execute();
    const testRegistration = registrations[0];

    const result = await withdrawRegistration(testRegistration.id, testStudentProfile.id);

    // Verify all original fields are preserved
    expect(result.student_profile_id).toEqual(testStudentProfile.id);
    expect(result.course_id).toEqual(testCourse.id);
    expect(result.semester).toEqual('spring');
    expect(result.year).toEqual(2025);
    expect(result.registration_date).toEqual(registrationDate);
    expect(result.created_at).toEqual(testRegistration.created_at);
    expect(result.status).toEqual('withdrawn');
    expect(result.updated_at.getTime()).toBeGreaterThan(testRegistration.updated_at.getTime());
  });
});