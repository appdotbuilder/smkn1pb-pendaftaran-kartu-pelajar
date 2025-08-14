import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  loginInputSchema,
  registerInputSchema,
  updateStudentProfileInputSchema,
  createRegistrationInputSchema,
  updateRegistrationStatusInputSchema
} from './schema';

// Import handlers
import { loginUser } from './handlers/auth_login';
import { registerUser } from './handlers/auth_register';
import { getDashboardData } from './handlers/get_dashboard_data';
import { getStudentProfile } from './handlers/get_student_profile';
import { updateStudentProfile } from './handlers/update_student_profile';
import { getAvailableCourses } from './handlers/get_available_courses';
import { createRegistration } from './handlers/create_registration';
import { getStudentRegistrations } from './handlers/get_student_registrations';
import { updateRegistrationStatus } from './handlers/update_registration_status';
import { withdrawRegistration } from './handlers/withdraw_registration';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication routes
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  register: publicProcedure
    .input(registerInputSchema)
    .mutation(({ input }) => registerUser(input)),

  // Dashboard route
  getDashboard: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getDashboardData(input.userId)),

  // Student profile routes
  getStudentProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getStudentProfile(input.userId)),

  updateStudentProfile: publicProcedure
    .input(updateStudentProfileInputSchema)
    .mutation(({ input }) => updateStudentProfile(input)),

  // Course routes
  getAvailableCourses: publicProcedure
    .input(z.object({
      semester: z.enum(['fall', 'spring', 'summer']),
      year: z.number().int()
    }))
    .query(({ input }) => getAvailableCourses(input.semester, input.year)),

  // Registration routes
  createRegistration: publicProcedure
    .input(createRegistrationInputSchema)
    .mutation(({ input }) => createRegistration(input)),

  getStudentRegistrations: publicProcedure
    .input(z.object({ studentProfileId: z.number() }))
    .query(({ input }) => getStudentRegistrations(input.studentProfileId)),

  withdrawRegistration: publicProcedure
    .input(z.object({
      registrationId: z.number(),
      studentProfileId: z.number()
    }))
    .mutation(({ input }) => withdrawRegistration(input.registrationId, input.studentProfileId)),

  // Admin routes
  updateRegistrationStatus: publicProcedure
    .input(updateRegistrationStatusInputSchema)
    .mutation(({ input }) => updateRegistrationStatus(input)),
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
}

start();