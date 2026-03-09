import { z } from "zod";

// Coerce empty strings → undefined before validation (Vercel sets unused integration vars to "")
const coerce = (val) => (val === "" ? undefined : val);

const server = z.object({
  DATABASE_URL: z.preprocess(coerce, z.string().url().optional()),
  POSTGRES_URL: z.preprocess(coerce, z.string().url().optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  DATABASE_URL_DIRECT: z.preprocess(coerce, z.string().url().optional()),
  RESEND_API_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  OPENAI_API_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  ANTHROPIC_API_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  XAI_API_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  YOUTUBE_API_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  STABILITY_API_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  REPLICATE_API_TOKEN: z.preprocess(coerce, z.string().min(1).optional()),
  LEONARDO_API_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  TURNSTILE_SECRET_KEY: z.preprocess(coerce, z.string().min(1).optional()),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const client = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_BASE_URL: z.preprocess(coerce, z.string().url().optional()),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.preprocess(coerce, z.string().min(1).optional()),
});

const processEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  DATABASE_URL_DIRECT: process.env.DATABASE_URL_DIRECT,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  XAI_API_KEY: process.env.XAI_API_KEY,
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  STABILITY_API_KEY: process.env.STABILITY_API_KEY,
  REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
  LEONARDO_API_KEY: process.env.LEONARDO_API_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
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
