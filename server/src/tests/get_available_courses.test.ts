import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { coursesTable } from '../db/schema';
import { getAvailableCourses } from '../handlers/get_available_courses';

describe('getAvailableCourses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active courses for specified semester and year with available spots', async () => {
    // Create test courses
    await db.insert(coursesTable).values([
      {
        code: 'CS101',
        name: 'Intro to Programming',
        description: 'Basic programming concepts',
        credits: 3,
        semester: 'fall',
        year: 2024,
        max_enrollment: 30,
        current_enrollment: 25,
        is_active: true
      },
      {
        code: 'CS102',
        name: 'Data Structures',
        description: 'Introduction to data structures',
        credits: 4,
        semester: 'fall',
        year: 2024,
        max_enrollment: 25,
        current_enrollment: 20,
        is_active: true
      }
    ]).execute();

    const result = await getAvailableCourses('fall', 2024);

    expect(result).toHaveLength(2);
    expect(result[0].code).toEqual('CS101');
    expect(result[0].name).toEqual('Intro to Programming');
    expect(result[0].semester).toEqual('fall');
    expect(result[0].year).toEqual(2024);
    expect(result[0].is_active).toEqual(true);
    expect(result[0].current_enrollment).toBeLessThan(result[0].max_enrollment);
    
    expect(result[1].code).toEqual('CS102');
    expect(result[1].semester).toEqual('fall');
    expect(result[1].year).toEqual(2024);
  });

  it('should exclude courses at maximum enrollment', async () => {
    await db.insert(coursesTable).values([
      {
        code: 'CS101',
        name: 'Available Course',
        description: 'Has spots available',
        credits: 3,
        semester: 'spring',
        year: 2024,
        max_enrollment: 30,
        current_enrollment: 25,
        is_active: true
      },
      {
        code: 'CS102',
        name: 'Full Course',
        description: 'At maximum capacity',
        credits: 4,
        semester: 'spring',
        year: 2024,
        max_enrollment: 20,
        current_enrollment: 20, // At max capacity
        is_active: true
      }
    ]).execute();

    const result = await getAvailableCourses('spring', 2024);

    expect(result).toHaveLength(1);
    expect(result[0].code).toEqual('CS101');
    expect(result[0].current_enrollment).toBeLessThan(result[0].max_enrollment);
  });

  it('should exclude inactive courses', async () => {
    await db.insert(coursesTable).values([
      {
        code: 'CS101',
        name: 'Active Course',
        description: 'This course is active',
        credits: 3,
        semester: 'summer',
        year: 2024,
        max_enrollment: 30,
        current_enrollment: 15,
        is_active: true
      },
      {
        code: 'CS102',
        name: 'Inactive Course',
        description: 'This course is inactive',
        credits: 4,
        semester: 'summer',
        year: 2024,
        max_enrollment: 25,
        current_enrollment: 10,
        is_active: false // Inactive course
      }
    ]).execute();

    const result = await getAvailableCourses('summer', 2024);

    expect(result).toHaveLength(1);
    expect(result[0].code).toEqual('CS101');
    expect(result[0].is_active).toEqual(true);
  });

  it('should filter by specific semester and year', async () => {
    await db.insert(coursesTable).values([
      {
        code: 'CS101',
        name: 'Fall 2024 Course',
        description: 'Course for fall 2024',
        credits: 3,
        semester: 'fall',
        year: 2024,
        max_enrollment: 30,
        current_enrollment: 15,
        is_active: true
      },
      {
        code: 'CS102',
        name: 'Spring 2024 Course',
        description: 'Course for spring 2024',
        credits: 4,
        semester: 'spring', // Different semester
        year: 2024,
        max_enrollment: 25,
        current_enrollment: 10,
        is_active: true
      },
      {
        code: 'CS103',
        name: 'Fall 2025 Course',
        description: 'Course for fall 2025',
        credits: 3,
        semester: 'fall',
        year: 2025, // Different year
        max_enrollment: 20,
        current_enrollment: 5,
        is_active: true
      }
    ]).execute();

    const result = await getAvailableCourses('fall', 2024);

    expect(result).toHaveLength(1);
    expect(result[0].code).toEqual('CS101');
    expect(result[0].semester).toEqual('fall');
    expect(result[0].year).toEqual(2024);
  });

  it('should return courses ordered by course code', async () => {
    await db.insert(coursesTable).values([
      {
        code: 'MATH201',
        name: 'Calculus II',
        description: 'Advanced calculus',
        credits: 4,
        semester: 'fall',
        year: 2024,
        max_enrollment: 25,
        current_enrollment: 15,
        is_active: true
      },
      {
        code: 'CS101',
        name: 'Programming Basics',
        description: 'Introduction to programming',
        credits: 3,
        semester: 'fall',
        year: 2024,
        max_enrollment: 30,
        current_enrollment: 20,
        is_active: true
      },
      {
        code: 'ENG101',
        name: 'English Composition',
        description: 'Writing fundamentals',
        credits: 3,
        semester: 'fall',
        year: 2024,
        max_enrollment: 20,
        current_enrollment: 12,
        is_active: true
      }
    ]).execute();

    const result = await getAvailableCourses('fall', 2024);

    expect(result).toHaveLength(3);
    // Should be ordered by course code
    expect(result[0].code).toEqual('CS101');
    expect(result[1].code).toEqual('ENG101');
    expect(result[2].code).toEqual('MATH201');
  });

  it('should return empty array when no courses match criteria', async () => {
    await db.insert(coursesTable).values([
      {
        code: 'CS101',
        name: 'Spring Course',
        description: 'Only available in spring',
        credits: 3,
        semester: 'spring',
        year: 2024,
        max_enrollment: 30,
        current_enrollment: 15,
        is_active: true
      }
    ]).execute();

    const result = await getAvailableCourses('fall', 2024);

    expect(result).toHaveLength(0);
  });

  it('should handle courses with zero current enrollment', async () => {
    await db.insert(coursesTable).values([
      {
        code: 'CS101',
        name: 'New Course',
        description: 'Brand new course with no students',
        credits: 3,
        semester: 'fall',
        year: 2024,
        max_enrollment: 25,
        current_enrollment: 0, // No students enrolled yet
        is_active: true
      }
    ]).execute();

    const result = await getAvailableCourses('fall', 2024);

    expect(result).toHaveLength(1);
    expect(result[0].code).toEqual('CS101');
    expect(result[0].current_enrollment).toEqual(0);
    expect(result[0].max_enrollment).toEqual(25);
  });
});