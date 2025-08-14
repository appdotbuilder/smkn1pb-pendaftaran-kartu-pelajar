import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, studentProfilesTable } from '../db/schema';
import { type UpdateStudentProfileInput } from '../schema';
import { updateStudentProfile } from '../handlers/update_student_profile';
import { eq } from 'drizzle-orm';

describe('updateStudentProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testStudentProfileId: number;

  beforeEach(async () => {
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        first_name: 'John',
        last_name: 'Doe',
        role: 'student'
      })
      .returning()
      .execute();

    testUserId = userResult[0].id;

    // Create a test student profile
    const profileResult = await db.insert(studentProfilesTable)
      .values({
        user_id: testUserId,
        student_id: 'STU123456',
        date_of_birth: new Date('2000-01-01'),
        phone: '555-0100',
        address: '123 Main St',
        emergency_contact_name: 'Jane Doe',
        emergency_contact_phone: '555-0200'
      })
      .returning()
      .execute();

    testStudentProfileId = profileResult[0].id;
  });

  it('should update all provided fields', async () => {
    const updateInput: UpdateStudentProfileInput = {
      id: testStudentProfileId,
      phone: '555-9999',
      address: '456 Oak Ave',
      emergency_contact_name: 'Updated Contact',
      emergency_contact_phone: '555-8888'
    };

    const result = await updateStudentProfile(updateInput);

    expect(result.id).toEqual(testStudentProfileId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.student_id).toEqual('STU123456');
    expect(result.phone).toEqual('555-9999');
    expect(result.address).toEqual('456 Oak Ave');
    expect(result.emergency_contact_name).toEqual('Updated Contact');
    expect(result.emergency_contact_phone).toEqual('555-8888');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only phone when other fields are not provided', async () => {
    const updateInput: UpdateStudentProfileInput = {
      id: testStudentProfileId,
      phone: '555-7777'
    };

    const result = await updateStudentProfile(updateInput);

    expect(result.phone).toEqual('555-7777');
    expect(result.address).toEqual('123 Main St'); // Should remain unchanged
    expect(result.emergency_contact_name).toEqual('Jane Doe'); // Should remain unchanged
    expect(result.emergency_contact_phone).toEqual('555-0200'); // Should remain unchanged
  });

  it('should set fields to null when null is provided', async () => {
    const updateInput: UpdateStudentProfileInput = {
      id: testStudentProfileId,
      phone: null,
      address: null
    };

    const result = await updateStudentProfile(updateInput);

    expect(result.phone).toBeNull();
    expect(result.address).toBeNull();
    expect(result.emergency_contact_name).toEqual('Jane Doe'); // Should remain unchanged
    expect(result.emergency_contact_phone).toEqual('555-0200'); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    const updateInput: UpdateStudentProfileInput = {
      id: testStudentProfileId,
      phone: '555-4444',
      emergency_contact_name: 'Database Test Contact'
    };

    await updateStudentProfile(updateInput);

    // Verify changes were saved to database
    const profiles = await db.select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.id, testStudentProfileId))
      .execute();

    expect(profiles).toHaveLength(1);
    const profile = profiles[0];
    expect(profile.phone).toEqual('555-4444');
    expect(profile.emergency_contact_name).toEqual('Database Test Contact');
    expect(profile.address).toEqual('123 Main St'); // Should remain unchanged
  });

  it('should update the updated_at timestamp', async () => {
    const originalProfile = await db.select()
      .from(studentProfilesTable)
      .where(eq(studentProfilesTable.id, testStudentProfileId))
      .execute();

    const originalUpdatedAt = originalProfile[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateStudentProfileInput = {
      id: testStudentProfileId,
      phone: '555-1111'
    };

    const result = await updateStudentProfile(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });

  it('should throw error when student profile does not exist', async () => {
    const updateInput: UpdateStudentProfileInput = {
      id: 99999, // Non-existent ID
      phone: '555-0000'
    };

    await expect(updateStudentProfile(updateInput)).rejects.toThrow(/Student profile with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    const updateInput: UpdateStudentProfileInput = {
      id: testStudentProfileId
      // No fields to update
    };

    const result = await updateStudentProfile(updateInput);

    expect(result.id).toEqual(testStudentProfileId);
    expect(result.phone).toEqual('555-0100'); // Should remain unchanged
    expect(result.address).toEqual('123 Main St'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});