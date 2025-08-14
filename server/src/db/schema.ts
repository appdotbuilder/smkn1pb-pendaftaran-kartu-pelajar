import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Enum definitions for PostgreSQL
export const genderEnum = pgEnum('gender', ['LAKI_LAKI', 'PEREMPUAN']);
export const religionEnum = pgEnum('religion', ['ISLAM', 'KRISTEN', 'KATOLIK', 'HINDU', 'BUDDHA', 'KONGHUCU']);
export const livingStatusEnum = pgEnum('living_status', ['ORANG_TUA', 'WALI', 'SENDIRI', 'KOST', 'ASRAMA']);
export const registrationTypeEnum = pgEnum('registration_type', ['BARU', 'DAFTAR_ULANG']);

// Students table for SMKN 1 Praya Barat
export const studentsTable = pgTable('students', {
  id: serial('id').primaryKey(),
  nisn: text('nisn').notNull().unique(), // National Student Identification Number (10 digits)
  nama: text('nama').notNull(),
  jenis_kelamin: genderEnum('jenis_kelamin').notNull(),
  tempat_lahir: text('tempat_lahir').notNull(),
  tanggal_lahir: timestamp('tanggal_lahir').notNull(),
  dusun: text('dusun').notNull(),
  desa: text('desa').notNull(),
  kecamatan: text('kecamatan').notNull(),
  alamat_lengkap: text('alamat_lengkap').notNull(), // Full concatenated address
  nomor_hp: text('nomor_hp').notNull(), // Phone/WhatsApp number
  agama: religionEnum('agama').notNull(),
  jumlah_saudara: integer('jumlah_saudara').notNull(), // Number of siblings
  anak_ke: integer('anak_ke').notNull(), // Child position (1st, 2nd, etc.)
  status_tinggal: livingStatusEnum('status_tinggal').notNull(), // Living arrangement
  asal_sekolah: text('asal_sekolah').notNull(), // Previous school
  foto_siswa: text('foto_siswa'), // Student photo (Base64 or file path) - nullable
  qr_code: text('qr_code').notNull().unique(), // Unique QR code identifier
  jenis_pendaftaran: registrationTypeEnum('jenis_pendaftaran').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type Student = typeof studentsTable.$inferSelect; // For SELECT operations
export type NewStudent = typeof studentsTable.$inferInsert; // For INSERT operations

// Export all tables and relations for proper query building
export const tables = { 
  students: studentsTable 
};

// Export enums for use in application logic
export const enums = {
  gender: genderEnum,
  religion: religionEnum,
  livingStatus: livingStatusEnum,
  registrationType: registrationTypeEnum
};