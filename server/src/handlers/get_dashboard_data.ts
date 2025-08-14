import { db } from '../db';
import { studentProfilesTable, registrationsTable, coursesTable } from '../db/schema';
import { type DashboardData } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getDashboardData(userId: number): Promise<DashboardData> {
  try {
    // First, get the student profile for this user
    const studentProfiles = await db.select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.user_id, userId))
      .execute();

    if (studentProfiles.length === 0) {
      throw new Error('Student profile not found for user');
    }

    const studentProfile = studentProfiles[0];

    // Get current registrations with course details (using join)
    const registrationResults = await db.select()
      .from(registrationsTable)
      .innerJoin(coursesTable, eq(registrationsTable.course_id, coursesTable.id))
      .where(eq(registrationsTable.student_profile_id, studentProfile.id))
      .execute();

    // Map joined results back to registration format
    const currentRegistrations = registrationResults.map(result => ({
      id: result.registrations.id,
      student_profile_id: result.registrations.student_profile_id,
      course_id: result.registrations.course_id,
      semester: result.registrations.semester,
      year: result.registrations.year,
      status: result.registrations.status,
      registration_date: result.registrations.registration_date,
      created_at: result.registrations.created_at,
      updated_at: result.registrations.updated_at
    }));

    // Get all active courses
    const availableCourses = await db.select()
      .from(coursesTable)
      .where(eq(coursesTable.is_active, true))
      .execute();

    return {
      student_profile: studentProfile,
      current_registrations: currentRegistrations,
      available_courses: availableCourses
    };
  } catch (error) {
    console.error('Dashboard data retrieval failed:', error);
    throw error;
  }
}