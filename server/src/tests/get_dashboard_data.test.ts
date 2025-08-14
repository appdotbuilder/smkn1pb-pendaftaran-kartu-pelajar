import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable, coursesTable, registrationsTable } from '../db/schema';
import { getDashboardData } from '../handlers/get_dashboard_data';

describe('getDashboardData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get dashboard data for a student user', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create student profile
    const profileResult = await db.insert(studentProfilesTable)
      .values({
        user_id: userId,
        student_id: 'STU123456',
        date_of_birth: new Date('2000-01-01'),
        phone: '555-1234',
        address: '123 Main St',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '555-5678'
      })
      .returning()
      .execute();

    const studentProfileId = profileResult[0].id;

    // Create test courses
    const courseResults = await db.insert(coursesTable)
      .values([
        {
          code: 'CS101',
          name: 'Introduction to Computer Science',
          description: 'Basic computer science concepts',
          credits: 3,
          semester: 'fall',
          year: 2024,
          max_enrollment: 30,
          current_enrollment: 15,
          is_active: true
        },
        {
          code: 'MATH201',
          name: 'Calculus I',
          description: 'Differential calculus',
          credits: 4,
          semester: 'fall',
          year: 2024,
          max_enrollment: 25,
          current_enrollment: 10,
          is_active: true
        },
        {
          code: 'ENG301',
          name: 'Advanced English',
          description: 'Advanced writing skills',
          credits: 3,
          semester: 'spring',
          year: 2024,
          max_enrollment: 20,
          current_enrollment: 5,
          is_active: false // Inactive course
        }
      ])
      .returning()
      .execute();

    // Create test registrations for first two courses
    await db.insert(registrationsTable)
      .values([
        {
          student_profile_id: studentProfileId,
          course_id: courseResults[0].id,
          semester: 'fall',
          year: 2024,
          status: 'approved'
        },
        {
          student_profile_id: studentProfileId,
          course_id: courseResults[1].id,
          semester: 'fall',
          year: 2024,
          status: 'pending'
        }
      ])
      .execute();

    // Get dashboard data
    const result = await getDashboardData(userId);

    // Validate student profile
    expect(result.student_profile.id).toEqual(studentProfileId);
    expect(result.student_profile.user_id).toEqual(userId);
    expect(result.student_profile.student_id).toEqual('STU123456');
    expect(result.student_profile.phone).toEqual('555-1234');
    expect(result.student_profile.address).toEqual('123 Main St');
    expect(result.student_profile.emergency_contact_name).toEqual('Jane Doe');
    expect(result.student_profile.emergency_contact_phone).toEqual('555-5678');
    expect(result.student_profile.date_of_birth).toBeInstanceOf(Date);
    expect(result.student_profile.created_at).toBeInstanceOf(Date);
    expect(result.student_profile.updated_at).toBeInstanceOf(Date);

    // Validate current registrations
    expect(result.current_registrations).toHaveLength(2);
    
    const approvedReg = result.current_registrations.find(r => r.status === 'approved');
    const pendingReg = result.current_registrations.find(r => r.status === 'pending');
    
    expect(approvedReg).toBeDefined();
    expect(approvedReg!.student_profile_id).toEqual(studentProfileId);
    expect(approvedReg!.course_id).toEqual(courseResults[0].id);
    expect(approvedReg!.semester).toEqual('fall');
    expect(approvedReg!.year).toEqual(2024);
    expect(approvedReg!.registration_date).toBeInstanceOf(Date);
    
    expect(pendingReg).toBeDefined();
    expect(pendingReg!.status).toEqual('pending');
    expect(pendingReg!.course_id).toEqual(courseResults[1].id);

    // Validate available courses (should include active courses only)
    expect(result.available_courses).toHaveLength(2);
    
    const cs101Course = result.available_courses.find(c => c.code === 'CS101');
    const mathCourse = result.available_courses.find(c => c.code === 'MATH201');
    const engCourse = result.available_courses.find(c => c.code === 'ENG301');
    
    expect(cs101Course).toBeDefined();
    expect(cs101Course!.name).toEqual('Introduction to Computer Science');
    expect(cs101Course!.credits).toEqual(3);
    expect(cs101Course!.is_active).toBe(true);
    
    expect(mathCourse).toBeDefined();
    expect(mathCourse!.name).toEqual('Calculus I');
    expect(mathCourse!.credits).toEqual(4);
    
    // Inactive course should not be included
    expect(engCourse).toBeUndefined();
  });

  it('should handle user with no registrations', async () => {
    // Create test user and profile but no registrations
    const userResult = await db.insert(usersTable)
      .values({
        email: 'newstudent@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    await db.insert(studentProfilesTable)
      .values({
        user_id: userId,
        student_id: 'STU789012',
        date_of_birth: new Date('1999-05-15'),
        phone: null,
        address: null,
        emergency_contact_name: null,
        emergency_contact_phone: null
      })
      .execute();

    // Create one active course
    await db.insert(coursesTable)
      .values({
        code: 'PHYS101',
        name: 'Introduction to Physics',
        description: 'Basic physics concepts',
        credits: 4,
        semester: 'spring',
        year: 2024,
        max_enrollment: 40,
        current_enrollment: 0,
        is_active: true
      })
      .execute();

    const result = await getDashboardData(userId);

    // Should have student profile with null values
    expect(result.student_profile.user_id).toEqual(userId);
    expect(result.student_profile.student_id).toEqual('STU789012');
    expect(result.student_profile.phone).toBeNull();
    expect(result.student_profile.address).toBeNull();
    expect(result.student_profile.emergency_contact_name).toBeNull();
    expect(result.student_profile.emergency_contact_phone).toBeNull();

    // Should have no current registrations
    expect(result.current_registrations).toHaveLength(0);

    // Should have available courses
    expect(result.available_courses).toHaveLength(1);
    expect(result.available_courses[0].code).toEqual('PHYS101');
  });

  it('should throw error when student profile not found', async () => {
    // Create user but no student profile
    const userResult = await db.insert(usersTable)
      .values({
        email: 'noprofile@test.com',
        password_hash: 'hashedpassword',
        first_name: 'No',
        last_name: 'Profile',
        role: 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    await expect(getDashboardData(userId)).rejects.toThrow(/student profile not found/i);
  });

  it('should handle non-existent user gracefully', async () => {
    const nonExistentUserId = 99999;

    await expect(getDashboardData(nonExistentUserId)).rejects.toThrow(/student profile not found/i);
  });

  it('should return only active courses in available courses', async () => {
    // Create test user and profile
    const userResult = await db.insert(usersTable)
      .values({
        email: 'active@test.com',
        password_hash: 'hashedpassword',
        first_name: 'Active',
        last_name: 'User',
        role: 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    await db.insert(studentProfilesTable)
      .values({
        user_id: userId,
        student_id: 'STU456789',
        date_of_birth: new Date('2001-03-20')
      })
      .execute();

    // Create mix of active and inactive courses
    await db.insert(coursesTable)
      .values([
        {
          code: 'ACTIVE1',
          name: 'Active Course 1',
          description: 'This is active',
          credits: 3,
          semester: 'fall',
          year: 2024,
          max_enrollment: 20,
          current_enrollment: 5,
          is_active: true
        },
        {
          code: 'INACTIVE1',
          name: 'Inactive Course 1',
          description: 'This is inactive',
          credits: 2,
          semester: 'fall',
          year: 2024,
          max_enrollment: 15,
          current_enrollment: 0,
          is_active: false
        },
        {
          code: 'ACTIVE2',
          name: 'Active Course 2',
          description: 'This is also active',
          credits: 4,
          semester: 'spring',
          year: 2024,
          max_enrollment: 30,
          current_enrollment: 12,
          is_active: true
        }
      ])
      .execute();

    const result = await getDashboardData(userId);

    // Should only return active courses
    expect(result.available_courses).toHaveLength(2);
    const courseCodes = result.available_courses.map(c => c.code);
    expect(courseCodes).toContain('ACTIVE1');
    expect(courseCodes).toContain('ACTIVE2');
    expect(courseCodes).not.toContain('INACTIVE1');

    // Verify all returned courses are active
    result.available_courses.forEach(course => {
      expect(course.is_active).toBe(true);
    });
  });
});