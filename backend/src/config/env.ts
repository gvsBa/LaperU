import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  ADMIN_EMAIL: z.email().default('admin@laperu.local'),
  ADMIN_NAME: z.string().min(2).default('Admin LaperU'),
  ADMIN_PASSWORD: z.string().min(8).default('GantiPassword123'),
  DATABASE_URL: z.string().default('mysql://root:password@localhost:3306/laperu'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173'),
  HOST: z.string().default('127.0.0.1'),
  IMAGE_MAX_BYTES: z.coerce.number().int().positive().default(2 * 1024 * 1024),
  JWT_ACCESS_SECRET: z.string().min(32).default('dev-access-secret-change-before-production-123'),
  JWT_REFRESH_SECRET: z.string().min(32).default('dev-refresh-secret-change-before-production-456'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_API_ORIGIN: z.url().default('http://localhost:3000'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().positive().default(30),
  UPLOAD_DIRECTORY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
