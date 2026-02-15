import { z } from "zod";

// Transform empty strings to undefined so .optional() works with Vercel's empty env vars
const emptyToUndefined = z.string().transform((v) => (v === "" ? undefined : v));
const optionalUrl = emptyToUndefined.pipe(z.string().url().optional());
const optionalString = emptyToUndefined.pipe(z.string().min(1).optional());

const server = z.object({
  DATABASE_URL: optionalUrl,
  POSTGRES_URL: optionalUrl,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  RESEND_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const client = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: emptyToUndefined.pipe(z.string().url().optional()),
});

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
};

// Skip validation during CI/build or when explicitly requested
const skipValidation =
  !!process.env.SKIP_ENV_VALIDATION ||
  !!process.env.CI ||
  process.env.npm_lifecycle_event === "build";

const merged = server.merge(client);

/** @type {z.infer<typeof merged>} */
export const env = skipValidation
  ? /** @type {any} */ (processEnv)
  : merged.parse(processEnv);
