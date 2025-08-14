import { db } from '../db';
import { registrationsTable } from '../db/schema';
import { type Registration } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStudentRegistrations(studentProfileId: number): Promise<Registration[]> {
  try {
    const results = await db.select()
      .from(registrationsTable)
      .where(eq(registrationsTable.student_profile_id, studentProfileId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch student registrations:', error);
    throw error;
  }
}