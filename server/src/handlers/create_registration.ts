import { db } from '../db';
import { registrationsTable, coursesTable, studentProfilesTable } from '../db/schema';
import { type CreateRegistrationInput, type Registration } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export async function createRegistration(input: CreateRegistrationInput): Promise<Registration> {
  try {
    // Start a transaction to ensure data consistency
    return await db.transaction(async (tx) => {
      // Validate that student profile exists
      const studentProfile = await tx.select()
        .from(studentProfilesTable)
        .where(eq(studentProfilesTable.id, input.student_profile_id))
        .execute();

      if (studentProfile.length === 0) {
        throw new Error(`Student profile with id ${input.student_profile_id} not found`);
      }

      // Validate that course exists and is active
      const course = await tx.select()
        .from(coursesTable)
        .where(eq(coursesTable.id, input.course_id))
        .execute();

      if (course.length === 0) {
        throw new Error(`Course with id ${input.course_id} not found`);
      }

      const courseData = course[0];

      if (!courseData.is_active) {
        throw new Error(`Course ${courseData.code} is not currently active`);
      }

      // Check if course has available spots
      if (courseData.current_enrollment >= courseData.max_enrollment) {
        throw new Error(`Course ${courseData.code} is full (${courseData.current_enrollment}/${courseData.max_enrollment})`);
      }

      // Check if student already has a registration for this course in the same semester/year
      const existingRegistration = await tx.select()
        .from(registrationsTable)
        .where(
          and(
            eq(registrationsTable.student_profile_id, input.student_profile_id),
            eq(registrationsTable.course_id, input.course_id),
            eq(registrationsTable.semester, input.semester),
            eq(registrationsTable.year, input.year)
          )
        )
        .execute();

      if (existingRegistration.length > 0) {
        throw new Error(`Student already has a registration for course ${courseData.code} in ${input.semester} ${input.year}`);
      }

      // Create the registration
      const registrationResult = await tx.insert(registrationsTable)
        .values({
          student_profile_id: input.student_profile_id,
          course_id: input.course_id,
          semester: input.semester,
          year: input.year,
          status: 'pending'
        })
        .returning()
        .execute();

      // Increment the course's current enrollment count
      await tx.update(coursesTable)
        .set({ 
          current_enrollment: sql`${coursesTable.current_enrollment} + 1`,
          updated_at: new Date()
        })
        .where(eq(coursesTable.id, input.course_id))
        .execute();

      return registrationResult[0];
    });
  } catch (error) {
    console.error('Registration creation failed:', error);
    throw error;
  }
}