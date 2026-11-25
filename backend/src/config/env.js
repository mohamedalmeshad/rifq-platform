import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  MONGODB_URI: isProduction
    ? z.string().min(1, 'MONGODB_URI is required in production')
    : z.string().min(1).default('mongodb://127.0.0.1:27017/rifq_platform'),
  JWT_SECRET: isProduction
    ? z.string().min(32, 'JWT_SECRET must be at least 32 characters in production')
    : z.string().min(16).default('rifq_dev_jwt_secret_change_in_production'),
  JWT_EXPIRES_IN: z.string().min(1).default('8h'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10, 'BCRYPT_SALT_ROUNDS must be >= 10').max(15).default(10),
  ADULT_AGE_THRESHOLD: z.coerce.number().int().min(1).max(120).default(18),
  CORS_ORIGIN: z.string().min(1).default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formattedErrors = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${formattedErrors}`);
}

export const env = Object.freeze(parsed.data);
export default env;
