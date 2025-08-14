import { db } from '../db';
import { studentProfilesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type StudentProfile } from '../schema';

export const getStudentProfile = async (userId: number): Promise<StudentProfile | null> => {
  try {
    const result = await db.select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.user_id, userId))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const profile = result[0];
    return {
      id: profile.id,
      user_id: profile.user_id,
      student_id: profile.student_id,
      date_of_birth: profile.date_of_birth,
      phone: profile.phone,
      address: profile.address,
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };
  } catch (error) {
    console.error('Student profile retrieval failed:', error);
    throw error;
  }
};