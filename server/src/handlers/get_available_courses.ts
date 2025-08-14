import { db } from '../db';
import { coursesTable } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { type Course } from '../schema';

export const getAvailableCourses = async (semester: 'fall' | 'spring' | 'summer', year: number): Promise<Course[]> => {
  try {
    // Query active courses for the specified semester and year
    // that haven't reached maximum enrollment
    const results = await db.select()
      .from(coursesTable)
      .where(
        and(
          eq(coursesTable.semester, semester),
          eq(coursesTable.year, year),
          eq(coursesTable.is_active, true),
          lt(coursesTable.current_enrollment, coursesTable.max_enrollment)
        )
      )
      .orderBy(coursesTable.code)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get available courses:', error);
    throw error;
  }
};