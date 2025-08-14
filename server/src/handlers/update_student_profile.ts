import { db } from '../db';
import { studentProfilesTable } from '../db/schema';
import { type UpdateStudentProfileInput, type StudentProfile } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStudentProfile = async (input: UpdateStudentProfileInput): Promise<StudentProfile> => {
  try {
    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }

    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    if (input.emergency_contact_name !== undefined) {
      updateData.emergency_contact_name = input.emergency_contact_name;
    }

    if (input.emergency_contact_phone !== undefined) {
      updateData.emergency_contact_phone = input.emergency_contact_phone;
    }

    // Update the student profile
    const result = await db.update(studentProfilesTable)
      .set(updateData)
      .where(eq(studentProfilesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Student profile with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Student profile update failed:', error);
    throw error;
  }
};