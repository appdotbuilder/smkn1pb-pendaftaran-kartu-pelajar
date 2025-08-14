import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable, coursesTable, registrationsTable } from '../db/schema';
import { getStudentRegistrations } from '../handlers/get_student_registrations';

describe('getStudentRegistrations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return registrations for a specific student', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student'
      })
      .returning()
      .execute();

    // Create student profile
    const studentResult = await db.insert(studentProfilesTable)
      .values({
        user_id: userResult[0].id,
        student_id: 'STU001',
        date_of_birth: new Date('2000-01-01')
      })
      .returning()
      .execute();

    // Create test course
    const courseResult = await db.insert(coursesTable)
      .values({
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        semester: 'fall',
        year: 2024,
        max_enrollment: 30
      })
      .returning()
      .execute();

    // Create registration
    const registrationResult = await db.insert(registrationsTable)
      .values({
        student_profile_id: studentResult[0].id,
        course_id: courseResult[0].id,
        semester: 'fall',
        year: 2024,
        status: 'approved'
      })
      .returning()
      .execute();

    const result = await getStudentRegistrations(studentResult[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(registrationResult[0].id);
    expect(result[0].student_profile_id).toBe(studentResult[0].id);
    expect(result[0].course_id).toBe(courseResult[0].id);
    expect(result[0].semester).toBe('fall');
    expect(result[0].year).toBe(2024);
    expect(result[0].status).toBe('approved');
    expect(result[0].registration_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple registrations for a student', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'student'
      })
      .returning()
      .execute();

    // Create student profile
    const studentResult = await db.insert(studentProfilesTable)
      .values({
        user_id: userResult[0].id,
        student_id: 'STU002',
        date_of_birth: new Date('1999-05-15')
      })
      .returning()
      .execute();

    // Create multiple test courses
    const course1Result = await db.insert(coursesTable)
      .values({
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        semester: 'fall',
        year: 2024,
        max_enrollment: 30
      })
      .returning()
      .execute();

    const course2Result = await db.insert(coursesTable)
      .values({
        code: 'MATH201',
        name: 'Calculus I',
        credits: 4,
        semester: 'fall',
        year: 2024,
        max_enrollment: 25
      })
      .returning()
      .execute();

    // Create multiple registrations
    await db.insert(registrationsTable)
      .values([
        {
          student_profile_id: studentResult[0].id,
          course_id: course1Result[0].id,
          semester: 'fall',
          year: 2024,
          status: 'approved'
        },
        {
          student_profile_id: studentResult[0].id,
          course_id: course2Result[0].id,
          semester: 'fall',
          year: 2024,
          status: 'pending'
        }
      ])
      .execute();

    const result = await getStudentRegistrations(studentResult[0].id);

    expect(result).toHaveLength(2);
    
    // Verify both registrations belong to the same student
    result.forEach(registration => {
      expect(registration.student_profile_id).toBe(studentResult[0].id);
      expect(registration.semester).toBe('fall');
      expect(registration.year).toBe(2024);
      expect(['approved', 'pending']).toContain(registration.status);
    });

    // Verify different courses are registered
    const courseIds = result.map(r => r.course_id);
    expect(courseIds).toContain(course1Result[0].id);
    expect(courseIds).toContain(course2Result[0].id);
  });

  it('should return empty array for student with no registrations', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'newstudent@test.com',
        password_hash: 'hashed_password',
        first_name: 'New',
        last_name: 'Student',
        role: 'student'
      })
      .returning()
      .execute();

    // Create student profile
    const studentResult = await db.insert(studentProfilesTable)
      .values({
        user_id: userResult[0].id,
        student_id: 'STU003',
        date_of_birth: new Date('2001-03-20')
      })
      .returning()
      .execute();

    const result = await getStudentRegistrations(studentResult[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent student profile id', async () => {
    const result = await getStudentRegistrations(999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return registrations with different statuses', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'teststudent@test.com',
        password_hash: 'hashed_password',
        first_name: 'Test',
        last_name: 'Student',
        role: 'student'
      })
      .returning()
      .execute();

    // Create student profile
    const studentResult = await db.insert(studentProfilesTable)
      .values({
        user_id: userResult[0].id,
        student_id: 'STU004',
        date_of_birth: new Date('1998-12-10')
      })
      .returning()
      .execute();

    // Create test courses
    const courseResults = await db.insert(coursesTable)
      .values([
        {
          code: 'PHYS101',
          name: 'Physics I',
          credits: 4,
          semester: 'spring',
          year: 2024,
          max_enrollment: 20
        },
        {
          code: 'CHEM101',
          name: 'Chemistry I',
          credits: 3,
          semester: 'spring',
          year: 2024,
          max_enrollment: 25
        },
        {
          code: 'BIO101',
          name: 'Biology I',
          credits: 3,
          semester: 'spring',
          year: 2024,
          max_enrollment: 30
        },
        {
          code: 'HIST101',
          name: 'World History',
          credits: 3,
          semester: 'spring',
          year: 2024,
          max_enrollment: 40
        }
      ])
      .returning()
      .execute();

    // Create registrations with different statuses
    await db.insert(registrationsTable)
      .values([
        {
          student_profile_id: studentResult[0].id,
          course_id: courseResults[0].id,
          semester: 'spring',
          year: 2024,
          status: 'pending'
        },
        {
          student_profile_id: studentResult[0].id,
          course_id: courseResults[1].id,
          semester: 'spring',
          year: 2024,
          status: 'approved'
        },
        {
          student_profile_id: studentResult[0].id,
          course_id: courseResults[2].id,
          semester: 'spring',
          year: 2024,
          status: 'rejected'
        },
        {
          student_profile_id: studentResult[0].id,
          course_id: courseResults[3].id,
          semester: 'spring',
          year: 2024,
          status: 'withdrawn'
        }
      ])
      .execute();

    const result = await getStudentRegistrations(studentResult[0].id);

    expect(result).toHaveLength(4);
    
    const statuses = result.map(r => r.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('approved');
    expect(statuses).toContain('rejected');
    expect(statuses).toContain('withdrawn');

    // Verify all registrations have proper date fields
    result.forEach(registration => {
      expect(registration.registration_date).toBeInstanceOf(Date);
      expect(registration.created_at).toBeInstanceOf(Date);
      expect(registration.updated_at).toBeInstanceOf(Date);
    });
  });
});