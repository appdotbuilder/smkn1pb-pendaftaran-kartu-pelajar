import { z } from 'zod';

// Gender enum schema
export const genderSchema = z.enum(['LAKI_LAKI', 'PEREMPUAN']);
export type Gender = z.infer<typeof genderSchema>;

// Religion enum schema
export const religionSchema = z.enum(['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']);
export type Religion = z.infer<typeof religionSchema>;

// Living status enum schema
export const livingStatusSchema = z.enum(['ORANG_TUA', 'WALI', 'SENDIRI', 'KOST', 'ASRAMA']);
export type LivingStatus = z.infer<typeof livingStatusSchema>;

// Student registration type enum schema
export const registrationTypeSchema = z.enum(['BARU', 'DAFTAR_ULANG']);
export type RegistrationType = z.infer<typeof registrationTypeSchema>;

// Student schema with proper type handling
export const studentSchema = z.object({
  id: z.number(),
  nisn: z.string(),
  nama: z.string(),
  jenis_kelamin: genderSchema,
  tempat_lahir: z.string(),
  tanggal_lahir: z.coerce.date(),
  dusun: z.string(),
  desa: z.string(),
  kecamatan: z.string(),
  alamat_lengkap: z.string(),
  nomor_hp: z.string(),
  agama: religionSchema,
  jumlah_saudara: z.number().int().nonnegative(),
  anak_ke: z.number().int().positive(),
  status_tinggal: livingStatusSchema,
  asal_sekolah: z.string(),
  foto_siswa: z.string().nullable(), // Base64 encoded image or file path
  qr_code: z.string(), // Unique QR code identifier
  jenis_pendaftaran: registrationTypeSchema,
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Student = z.infer<typeof studentSchema>;

// Input schema for creating/registering students
export const createStudentInputSchema = z.object({
  nisn: z.string().min(10, 'NISN harus 10 digit').max(10, 'NISN harus 10 digit'),
  nama: z.string().min(1, 'Nama tidak boleh kosong'),
  jenis_kelamin: genderSchema,
  tempat_lahir: z.string().min(1, 'Tempat lahir tidak boleh kosong'),
  tanggal_lahir: z.coerce.date(),
  dusun: z.string().min(1, 'Dusun tidak boleh kosong'),
  desa: z.string().min(1, 'Desa tidak boleh kosong'),
  kecamatan: z.string().min(1, 'Kecamatan tidak boleh kosong'),
  alamat_lengkap: z.string().min(1, 'Alamat lengkap tidak boleh kosong'),
  nomor_hp: z.string().min(10, 'Nomor HP minimal 10 digit'),
  agama: religionSchema,
  jumlah_saudara: z.number().int().nonnegative(),
  anak_ke: z.number().int().positive(),
  status_tinggal: livingStatusSchema,
  asal_sekolah: z.string().min(1, 'Asal sekolah tidak boleh kosong'),
  foto_siswa: z.string().nullable(), // Base64 encoded image or file path
  jenis_pendaftaran: registrationTypeSchema
});

export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;

// Input schema for updating student data
export const updateStudentInputSchema = z.object({
  id: z.number(),
  nisn: z.string().min(10).max(10).optional(),
  nama: z.string().min(1).optional(),
  jenis_kelamin: genderSchema.optional(),
  tempat_lahir: z.string().min(1).optional(),
  tanggal_lahir: z.coerce.date().optional(),
  dusun: z.string().min(1).optional(),
  desa: z.string().min(1).optional(),
  kecamatan: z.string().min(1).optional(),
  alamat_lengkap: z.string().min(1).optional(),
  nomor_hp: z.string().min(10).optional(),
  agama: religionSchema.optional(),
  jumlah_saudara: z.number().int().nonnegative().optional(),
  anak_ke: z.number().int().positive().optional(),
  status_tinggal: livingStatusSchema.optional(),
  asal_sekolah: z.string().min(1).optional(),
  foto_siswa: z.string().nullable().optional(),
  jenis_pendaftaran: registrationTypeSchema.optional()
});

export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;

// Student ID query schema
export const studentIdSchema = z.object({
  id: z.number()
});

export type StudentIdInput = z.infer<typeof studentIdSchema>;

// NISN query schema
export const nisnQuerySchema = z.object({
  nisn: z.string().min(10).max(10)
});

export type NisnQueryInput = z.infer<typeof nisnQuerySchema>;

// Student card data schema for printing
export const studentCardSchema = z.object({
  id: z.number(),
  nisn: z.string(),
  nama: z.string(),
  tempat_lahir: z.string(),
  tanggal_lahir: z.coerce.date(),
  alamat_lengkap: z.string(),
  foto_siswa: z.string().nullable(),
  qr_code: z.string(),
  created_at: z.coerce.date()
});

export type StudentCard = z.infer<typeof studentCardSchema>;

// Filter schema for student queries
export const studentFilterSchema = z.object({
  jenis_pendaftaran: registrationTypeSchema.optional(),
  jenis_kelamin: genderSchema.optional(),
  agama: religionSchema.optional(),
  kecamatan: z.string().optional(),
  asal_sekolah: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type StudentFilter = z.infer<typeof studentFilterSchema>;