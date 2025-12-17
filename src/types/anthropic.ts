import { z } from 'zod';

// =============================================================================
// Anthropic Types (Zod Schemas)
// =============================================================================
// Note: Official SDK types available at '@anthropic-ai/sdk/resources/messages'
// We use custom types here because:
// 1. SDK response types require fields vLLM doesn't provide (citations, cache_creation)
// 2. We need flexible types for proxy transformations

/** Anthropic message content block schema. */
export const AnthropicContentBlockSchema = z.object({
    type: z.string(),
    text: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional(),
    input: z.record(z.string(), z.unknown()).optional(),
    tool_use_id: z.string().optional(),
    content: z.unknown().optional(),
}).passthrough();

/** Anthropic message schema. */
export const AnthropicMessageSchema = z.object({
    role: z.enum(['user', 'assistant']),
    content: z.union([z.string(), z.array(AnthropicContentBlockSchema)]),
});

/** Anthropic API request schema. */
export const AnthropicRequestSchema = z.object({
    model: z.string(),
    messages: z.array(AnthropicMessageSchema),
    max_tokens: z.number(),
    system: z.union([
        z.string(),
        z.array(z.object({ type: z.string(), text: z.string() })),
    ]).optional(),
    stream: z.boolean().optional(),
}).passthrough();

/** Anthropic API response schema. */
export const AnthropicResponseSchema = z.object({
    id: z.string(),
    type: z.literal('message'),
    role: z.literal('assistant'),
    content: z.array(AnthropicContentBlockSchema),
    model: z.string(),
    stop_reason: z.string().nullable(),
    usage: z.object({
        input_tokens: z.number(),
        output_tokens: z.number(),
    }),
});

// Inferred types from schemas
export type AnthropicContentBlock = z.infer<typeof AnthropicContentBlockSchema>;
export type AnthropicMessage = z.infer<typeof AnthropicMessageSchema>;
export type AnthropicRequest = z.infer<typeof AnthropicRequestSchema>;
export type AnthropicResponse = z.infer<typeof AnthropicResponseSchema>;
