import { z } from 'zod';

// User schema for authentication
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password_hash: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['student', 'admin']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Student profile schema
export const studentProfileSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  student_id: z.string(),
  date_of_birth: z.coerce.date(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  emergency_contact_name: z.string().nullable(),
  emergency_contact_phone: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type StudentProfile = z.infer<typeof studentProfileSchema>;

// Course schema
export const courseSchema = z.object({
  id: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  credits: z.number().int(),
  semester: z.enum(['fall', 'spring', 'summer']),
  year: z.number().int(),
  max_enrollment: z.number().int(),
  current_enrollment: z.number().int(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Course = z.infer<typeof courseSchema>;

// Registration schema
export const registrationSchema = z.object({
  id: z.number(),
  student_profile_id: z.number(),
  course_id: z.number(),
  semester: z.enum(['fall', 'spring', 'summer']),
  year: z.number().int(),
  status: z.enum(['pending', 'approved', 'rejected', 'withdrawn']),
  registration_date: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Registration = z.infer<typeof registrationSchema>;

// Input schemas for authentication
export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type LoginInput = z.infer<typeof loginInputSchema>;

export const registerInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  student_id: z.string().min(1),
  date_of_birth: z.coerce.date(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional()
});

export type RegisterInput = z.infer<typeof registerInputSchema>;

// Input schema for creating student profile
export const createStudentProfileInputSchema = z.object({
  user_id: z.number(),
  student_id: z.string(),
  date_of_birth: z.coerce.date(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional()
});

export type CreateStudentProfileInput = z.infer<typeof createStudentProfileInputSchema>;

// Input schema for updating student profile
export const updateStudentProfileInputSchema = z.object({
  id: z.number(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  emergency_contact_name: z.string().nullable().optional(),
  emergency_contact_phone: z.string().nullable().optional()
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileInputSchema>;

// Input schema for course registration
export const createRegistrationInputSchema = z.object({
  student_profile_id: z.number(),
  course_id: z.number(),
  semester: z.enum(['fall', 'spring', 'summer']),
  year: z.number().int()
});

export type CreateRegistrationInput = z.infer<typeof createRegistrationInputSchema>;

// Input schema for updating registration status
export const updateRegistrationStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'approved', 'rejected', 'withdrawn'])
});

export type UpdateRegistrationStatusInput = z.infer<typeof updateRegistrationStatusInputSchema>;

// Auth response schema
export const authResponseSchema = z.object({
  user: userSchema,
  token: z.string().optional()
});

export type AuthResponse = z.infer<typeof authResponseSchema>;

// Dashboard data schema
export const dashboardDataSchema = z.object({
  student_profile: studentProfileSchema,
  current_registrations: z.array(registrationSchema),
  available_courses: z.array(courseSchema)
});

export type DashboardData = z.infer<typeof dashboardDataSchema>;