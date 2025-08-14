import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createStudentInputSchema, 
  updateStudentInputSchema, 
  studentIdSchema, 
  nisnQuerySchema, 
  studentFilterSchema 
} from './schema';

// Import handlers
import { createStudent } from './handlers/create_student';
import { getStudents, getAllStudents } from './handlers/get_students';
import { getStudentById } from './handlers/get_student_by_id';
import { getStudentByNisn } from './handlers/get_student_by_nisn';
import { updateStudent } from './handlers/update_student';
import { deleteStudent } from './handlers/delete_student';
import { generateStudentCard, generateStudentCardByNisn } from './handlers/generate_student_card';
import { verifyQrCode } from './handlers/verify_qr_code';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Student registration and management endpoints
  createStudent: publicProcedure
    .input(createStudentInputSchema)
    .mutation(({ input }) => createStudent(input)),

  getStudents: publicProcedure
    .input(studentFilterSchema.optional())
    .query(({ input }) => getStudents(input)),

  getAllStudents: publicProcedure
    .query(() => getAllStudents()),

  getStudentById: publicProcedure
    .input(studentIdSchema)
    .query(({ input }) => getStudentById(input.id)),

  getStudentByNisn: publicProcedure
    .input(nisnQuerySchema)
    .query(({ input }) => getStudentByNisn(input.nisn)),

  updateStudent: publicProcedure
    .input(updateStudentInputSchema)
    .mutation(({ input }) => updateStudent(input)),

  deleteStudent: publicProcedure
    .input(studentIdSchema)
    .mutation(({ input }) => deleteStudent(input.id)),

  // Student card generation endpoints
  generateStudentCard: publicProcedure
    .input(studentIdSchema)
    .query(({ input }) => generateStudentCard(input.id)),

  generateStudentCardByNisn: publicProcedure
    .input(nisnQuerySchema)
    .query(({ input }) => generateStudentCardByNisn(input.nisn)),

  // QR code verification endpoint
  verifyQrCode: publicProcedure
    .input(z.object({ qrCode: z.string() }))
    .query(({ input }) => verifyQrCode(input.qrCode)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
  console.log(`Student Registration System for SMKN 1 Praya Barat is ready!`);
}

start();