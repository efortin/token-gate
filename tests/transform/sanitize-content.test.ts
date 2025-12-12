import { describe, it, expect } from 'vitest';
import { sanitizeMessageContent } from '../../src/transform/sanitize-content.js';
import type { AnthropicRequest } from '../../src/types/index.js';

describe('sanitizeMessageContent', () => {
  it('should pass through string content unchanged', () => {
    const request: AnthropicRequest = {
      model: 'test',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 100,
    };

    const result = sanitizeMessageContent(request);

    expect(result.messages[0].content).toBe('Hello');
  });

  it('should pass through array content with text blocks unchanged', () => {
    const request: AnthropicRequest = {
      model: 'test',
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: 'Hello' }],
      }],
      max_tokens: 100,
    };

    const result = sanitizeMessageContent(request);

    expect(result.messages[0].content).toEqual([{ type: 'text', text: 'Hello' }]);
  });

  it('should stringify tool_result with array content', () => {
    const mcpResults = [
      { url: 'https://example.com', title: 'Example' },
      { url: 'https://test.com', title: 'Test' },
    ];

    const request: AnthropicRequest = {
      model: 'test',
      messages: [{
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: 'test-id',
          content: mcpResults,
        }],
      }],
      max_tokens: 100,
    };

    const result = sanitizeMessageContent(request);
    const content = result.messages[0].content;

    expect(Array.isArray(content)).toBe(true);
    if (Array.isArray(content)) {
      expect(content[0].type).toBe('tool_result');
      expect(typeof content[0].content).toBe('string');
      expect(content[0].content).toBe(JSON.stringify(mcpResults));
    }
  });

  it('should stringify tool_result with object content', () => {
    const mcpResult = { data: 'test', nested: { value: 123 } };

    const request: AnthropicRequest = {
      model: 'test',
      messages: [{
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: 'test-id',
          content: mcpResult,
        }],
      }],
      max_tokens: 100,
    };

    const result = sanitizeMessageContent(request);
    const content = result.messages[0].content;

    expect(Array.isArray(content)).toBe(true);
    if (Array.isArray(content)) {
      expect(content[0].content).toBe(JSON.stringify(mcpResult));
    }
  });

  it('should pass through tool_result with string content unchanged', () => {
    const request: AnthropicRequest = {
      model: 'test',
      messages: [{
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: 'test-id',
          content: 'Already a string',
        }],
      }],
      max_tokens: 100,
    };

    const result = sanitizeMessageContent(request);
    const content = result.messages[0].content;

    expect(Array.isArray(content)).toBe(true);
    if (Array.isArray(content)) {
      expect(content[0].content).toBe('Already a string');
    }
  });

  it('should handle non-array non-string content by stringifying', () => {
    const request = {
      model: 'test',
      messages: [{
        role: 'user' as const,
        content: { unexpected: 'object' } as unknown as string,
      }],
      max_tokens: 100,
    };

    const result = sanitizeMessageContent(request as AnthropicRequest);

    expect(result.messages[0].content).toBe('{"unexpected":"object"}');
  });

  it('should handle multiple messages with mixed content', () => {
    const request: AnthropicRequest = {
      model: 'test',
      messages: [
        { role: 'user', content: 'First message' },
        {
          role: 'assistant',
          content: [{ type: 'text', text: 'Response' }],
        },
        {
          role: 'user',
          content: [{
            type: 'tool_result',
            tool_use_id: 'id',
            content: [{ result: 'data' }],
          }],
        },
      ],
      max_tokens: 100,
    };

    const result = sanitizeMessageContent(request);

    expect(result.messages[0].content).toBe('First message');
    expect(result.messages[1].content).toEqual([{ type: 'text', text: 'Response' }]);
    
    const thirdContent = result.messages[2].content;
    expect(Array.isArray(thirdContent)).toBe(true);
    if (Array.isArray(thirdContent)) {
      expect(thirdContent[0].content).toBe('[{"result":"data"}]');
    }
  });

  it('should handle tool_result without content field', () => {
    const request: AnthropicRequest = {
      model: 'test',
      messages: [{
        role: 'user',
        content: [{
          type: 'tool_result',
          tool_use_id: 'test-id',
        }],
      }],
      max_tokens: 100,
    };

    const result = sanitizeMessageContent(request);
    const content = result.messages[0].content;

    expect(Array.isArray(content)).toBe(true);
    if (Array.isArray(content)) {
      expect(content[0].content).toBeUndefined();
    }
  });
});
