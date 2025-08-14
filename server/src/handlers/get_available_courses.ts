import { type Course } from '../schema';

export async function getAvailableCourses(semester: 'fall' | 'spring' | 'summer', year: number): Promise<Course[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all active courses for a specific semester and year.
    // Should filter by semester, year, and is_active = true.
    // Should exclude courses that are at max enrollment capacity.
    return Promise.resolve([
        {
            id: 1,
            code: 'CS101',
            name: 'Introduction to Computer Science',
            description: 'Basic programming concepts and computer science fundamentals',
            credits: 3,
            semester: semester,
            year: year,
            max_enrollment: 30,
            current_enrollment: 25,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
        }
    ]);
}