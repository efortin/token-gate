import { z } from 'zod';

// =============================================================================
// Config Schemas (Zod) - Runtime validated
// =============================================================================

/** Backend configuration schema. */
export const BackendConfigSchema = z.object({
    name: z.string().default('vllm'),
    url: z.string().min(1, 'VLLM_URL is required'),
    apiKey: z.string().default(''),
    model: z.string().default(''),
    temperature: z.coerce.number().min(0).max(1).optional(),
});

/** Router configuration schema (loaded from environment). */
export const RouterConfigSchema = z.object({
    port: z.coerce.number().int().min(1).max(65535).default(3456),
    host: z.string().default('0.0.0.0'),
    apiKey: z.string().default(''),
    defaultBackend: BackendConfigSchema,
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    logPretty: z.coerce.boolean().default(false),
    logFilePath: z.string().optional(),
});

/** Application configuration schema (runtime subset). */
export const AppConfigSchema = z.object({
    port: z.coerce.number().int().min(1).max(65535),
    host: z.string(),
    apiKey: z.string(),
    defaultBackend: BackendConfigSchema,
    logLevel: z.enum(['debug', 'info', 'warn', 'error']),
});

// Inferred types from schemas
export type BackendConfig = z.infer<typeof BackendConfigSchema>;
export type RouterConfig = z.infer<typeof RouterConfigSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
