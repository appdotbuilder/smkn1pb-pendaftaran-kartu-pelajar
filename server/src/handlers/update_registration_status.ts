import { db } from '../db';
import { registrationsTable, coursesTable } from '../db/schema';
import { type UpdateRegistrationStatusInput, type Registration } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const updateRegistrationStatus = async (input: UpdateRegistrationStatusInput): Promise<Registration> => {
  try {
    // First, get the current registration and course details
    const registrationResult = await db.select()
      .from(registrationsTable)
      .innerJoin(coursesTable, eq(registrationsTable.course_id, coursesTable.id))
      .where(eq(registrationsTable.id, input.id))
      .execute();

    if (registrationResult.length === 0) {
      throw new Error(`Registration with id ${input.id} not found`);
    }

    const currentRegistration = registrationResult[0].registrations;
    const course = registrationResult[0].courses;
    const currentStatus = currentRegistration.status;
    const newStatus = input.status;

    // If status isn't changing, just return current registration
    if (currentStatus === newStatus) {
      return currentRegistration;
    }

    // Check enrollment capacity when approving
    if (newStatus === 'approved' && (currentStatus === 'pending' || currentStatus === 'rejected')) {
      if (course.current_enrollment >= course.max_enrollment) {
        throw new Error(`Course ${course.code} has reached maximum enrollment capacity`);
      }
    }

    // Calculate enrollment change
    let enrollmentChange = 0;
    
    // If changing from pending/rejected to approved: increment enrollment
    if (newStatus === 'approved' && (currentStatus === 'pending' || currentStatus === 'rejected')) {
      enrollmentChange = 1;
    }
    
    // If changing from approved to rejected/withdrawn: decrement enrollment
    if ((newStatus === 'rejected' || newStatus === 'withdrawn') && currentStatus === 'approved') {
      enrollmentChange = -1;
    }

    // Update registration status and course enrollment in a transaction
    const result = await db.transaction(async (tx) => {
      // Update registration status
      const updatedRegistration = await tx.update(registrationsTable)
        .set({
          status: newStatus,
          updated_at: sql`now()`
        })
        .where(eq(registrationsTable.id, input.id))
        .returning()
        .execute();

      // Update course enrollment if needed
      if (enrollmentChange !== 0) {
        await tx.update(coursesTable)
          .set({
            current_enrollment: sql`current_enrollment + ${enrollmentChange}`,
            updated_at: sql`now()`
          })
          .where(eq(coursesTable.id, course.id))
          .execute();
      }

      return updatedRegistration[0];
    });

    return result;
  } catch (error) {
    console.error('Registration status update failed:', error);
    throw error;
  }
};