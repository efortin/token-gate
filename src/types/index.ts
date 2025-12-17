// Re-export Anthropic types from dedicated file
export {
  AnthropicContentBlockSchema,
  AnthropicMessageSchema,
  AnthropicRequestSchema,
  AnthropicResponseSchema,
  type AnthropicContentBlock,
  type AnthropicMessage,
  type AnthropicRequest,
  type AnthropicResponse,
} from './anthropic.js';


/** OpenAI message content. */
export interface OpenAIMessageContent {
  type: string;
  text?: string;
  image_url?: { url: string };
  [key: string]: unknown;
}

/** OpenAI message. */
export interface OpenAIMessage {
  role: string;
  content: string | OpenAIMessageContent[] | null;
  [key: string]: unknown;
}

/** OpenAI API request. */
export interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  stream?: boolean;
  [key: string]: unknown;
}

/** OpenAI API response. */
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: string; content: string | null };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Re-export config types from dedicated file
export {
  BackendConfigSchema,
  RouterConfigSchema,
  AppConfigSchema,
  type BackendConfig,
  type RouterConfig,
  type AppConfig,
} from './app-config.js';
