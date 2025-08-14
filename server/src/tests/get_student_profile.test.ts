import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable } from '../db/schema';
import { getStudentProfile } from '../handlers/get_student_profile';

describe('getStudentProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return student profile when it exists', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'student@test.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create student profile
    const profileData = {
      user_id: userId,
      student_id: 'STU12345',
      date_of_birth: new Date('2000-06-15'),
      phone: '+1234567890',
      address: '123 Main Street',
      emergency_contact_name: 'Jane Doe',
      emergency_contact_phone: '+9876543210'
    };

    await db.insert(studentProfilesTable)
      .values(profileData)
      .execute();

    const result = await getStudentProfile(userId);

    expect(result).toBeDefined();
    expect(result?.user_id).toEqual(userId);
    expect(result?.student_id).toEqual('STU12345');
    expect(result?.date_of_birth).toEqual(new Date('2000-06-15'));
    expect(result?.phone).toEqual('+1234567890');
    expect(result?.address).toEqual('123 Main Street');
    expect(result?.emergency_contact_name).toEqual('Jane Doe');
    expect(result?.emergency_contact_phone).toEqual('+9876543210');
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when student profile does not exist', async () => {
    // Create test user without a student profile
    const userResult = await db.insert(usersTable)
      .values({
        email: 'user@test.com',
        password_hash: 'hashed_password',
        first_name: 'Jane',
        last_name: 'Smith',
        role: 'admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    const result = await getStudentProfile(userId);

    expect(result).toBeNull();
  });

  it('should return null for non-existent user id', async () => {
    const nonExistentUserId = 99999;

    const result = await getStudentProfile(nonExistentUserId);

    expect(result).toBeNull();
  });

  it('should handle student profile with null optional fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'minimal@test.com',
        password_hash: 'hashed_password',
        first_name: 'Minimal',
        last_name: 'User',
        role: 'student'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create student profile with minimal data (null optional fields)
    const profileData = {
      user_id: userId,
      student_id: 'STU54321',
      date_of_birth: new Date('1999-12-31'),
      phone: null,
      address: null,
      emergency_contact_name: null,
      emergency_contact_phone: null
    };

    await db.insert(studentProfilesTable)
      .values(profileData)
      .execute();

    const result = await getStudentProfile(userId);

    expect(result).toBeDefined();
    expect(result?.user_id).toEqual(userId);
    expect(result?.student_id).toEqual('STU54321');
    expect(result?.date_of_birth).toEqual(new Date('1999-12-31'));
    expect(result?.phone).toBeNull();
    expect(result?.address).toBeNull();
    expect(result?.emergency_contact_name).toBeNull();
    expect(result?.emergency_contact_phone).toBeNull();
    expect(result?.id).toBeDefined();
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return correct profile when multiple profiles exist', async () => {
    // Create multiple users with profiles
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@test.com',
        password_hash: 'hashed_password1',
        first_name: 'User',
        last_name: 'One',
        role: 'student'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@test.com',
        password_hash: 'hashed_password2',
        first_name: 'User',
        last_name: 'Two',
        role: 'student'
      })
      .returning()
      .execute();

    const userId1 = user1Result[0].id;
    const userId2 = user2Result[0].id;

    // Create profiles for both users
    await db.insert(studentProfilesTable)
      .values({
        user_id: userId1,
        student_id: 'STU00001',
        date_of_birth: new Date('2000-01-01'),
        phone: '+1111111111'
      })
      .execute();

    await db.insert(studentProfilesTable)
      .values({
        user_id: userId2,
        student_id: 'STU00002',
        date_of_birth: new Date('2000-02-02'),
        phone: '+2222222222'
      })
      .execute();

    // Test retrieval of specific profile
    const result1 = await getStudentProfile(userId1);
    const result2 = await getStudentProfile(userId2);

    expect(result1?.user_id).toEqual(userId1);
    expect(result1?.student_id).toEqual('STU00001');
    expect(result1?.phone).toEqual('+1111111111');

    expect(result2?.user_id).toEqual(userId2);
    expect(result2?.student_id).toEqual('STU00002');
    expect(result2?.phone).toEqual('+2222222222');
  });
});