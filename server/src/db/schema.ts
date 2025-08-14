import { serial, text, pgTable, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['student', 'admin']);
export const semesterEnum = pgEnum('semester', ['fall', 'spring', 'summer']);
export const registrationStatusEnum = pgEnum('registration_status', ['pending', 'approved', 'rejected', 'withdrawn']);

// Users table for authentication
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  role: roleEnum('role').notNull().default('student'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Student profiles table
export const studentProfilesTable = pgTable('student_profiles', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  student_id: text('student_id').notNull().unique(),
  date_of_birth: timestamp('date_of_birth').notNull(),
  phone: text('phone'),
  address: text('address'),
  emergency_contact_name: text('emergency_contact_name'),
  emergency_contact_phone: text('emergency_contact_phone'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Courses table
export const coursesTable = pgTable('courses', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  credits: integer('credits').notNull(),
  semester: semesterEnum('semester').notNull(),
  year: integer('year').notNull(),
  max_enrollment: integer('max_enrollment').notNull(),
  current_enrollment: integer('current_enrollment').notNull().default(0),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Registrations table
export const registrationsTable = pgTable('registrations', {
  id: serial('id').primaryKey(),
  student_profile_id: integer('student_profile_id').notNull().references(() => studentProfilesTable.id),
  course_id: integer('course_id').notNull().references(() => coursesTable.id),
  semester: semesterEnum('semester').notNull(),
  year: integer('year').notNull(),
  status: registrationStatusEnum('status').notNull().default('pending'),
  registration_date: timestamp('registration_date').defaultNow().notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ one }) => ({
  studentProfile: one(studentProfilesTable, {
    fields: [usersTable.id],
    references: [studentProfilesTable.user_id],
  }),
}));

export const studentProfilesRelations = relations(studentProfilesTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [studentProfilesTable.user_id],
    references: [usersTable.id],
  }),
  registrations: many(registrationsTable),
}));

export const coursesRelations = relations(coursesTable, ({ many }) => ({
  registrations: many(registrationsTable),
}));

export const registrationsRelations = relations(registrationsTable, ({ one }) => ({
  studentProfile: one(studentProfilesTable, {
    fields: [registrationsTable.student_profile_id],
    references: [studentProfilesTable.id],
  }),
  course: one(coursesTable, {
    fields: [registrationsTable.course_id],
    references: [coursesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type StudentProfile = typeof studentProfilesTable.$inferSelect;
export type NewStudentProfile = typeof studentProfilesTable.$inferInsert;
export type Course = typeof coursesTable.$inferSelect;
export type NewCourse = typeof coursesTable.$inferInsert;
export type Registration = typeof registrationsTable.$inferSelect;
export type NewRegistration = typeof registrationsTable.$inferInsert;

// Important: Export all tables and relations for proper query building
export const tables = {
  users: usersTable,
  studentProfiles: studentProfilesTable,
  courses: coursesTable,
  registrations: registrationsTable
};