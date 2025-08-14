import { db } from '../db';
import { registrationsTable, coursesTable } from '../db/schema';
import { type Registration } from '../schema';
import { eq, and, sql } from 'drizzle-orm';

export async function withdrawRegistration(registrationId: number, studentProfileId: number): Promise<Registration> {
  try {
    // First, find the registration and validate it belongs to the student
    const existingRegistrations = await db.select()
      .from(registrationsTable)
      .where(
        and(
          eq(registrationsTable.id, registrationId),
          eq(registrationsTable.student_profile_id, studentProfileId)
        )
      )
      .execute();

    if (existingRegistrations.length === 0) {
      throw new Error('Registration not found or does not belong to this student');
    }

    const existingRegistration = existingRegistrations[0];

    // Check if registration is in a state that allows withdrawal
    if (existingRegistration.status === 'withdrawn') {
      throw new Error('Registration is already withdrawn');
    }

    if (existingRegistration.status === 'rejected') {
      throw new Error('Cannot withdraw a rejected registration');
    }

    // Check if the registration was previously approved
    const wasApproved = existingRegistration.status === 'approved';

    // Update registration status to withdrawn
    const updatedRegistrations = await db.update(registrationsTable)
      .set({ 
        status: 'withdrawn',
        updated_at: new Date()
      })
      .where(eq(registrationsTable.id, registrationId))
      .returning()
      .execute();

    // If the registration was approved, decrement the course enrollment
    if (wasApproved) {
      await db.update(coursesTable)
        .set({ 
          current_enrollment: sql`${coursesTable.current_enrollment} - 1`
        })
        .where(eq(coursesTable.id, existingRegistration.course_id))
        .execute();
    }

    return updatedRegistrations[0];
  } catch (error) {
    console.error('Registration withdrawal failed:', error);
    throw error;
  }
}