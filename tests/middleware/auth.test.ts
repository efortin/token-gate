import { describe, it, expect } from 'vitest';
import { isInternalBackend, resolveAuthHeader } from '../../src/middleware/auth.js';
import type { BackendConfig } from '../../src/types/index.js';

describe('isInternalBackend', () => {
  it('should return true for cluster.local URLs', () => {
    expect(isInternalBackend('http://service.namespace.svc.cluster.local')).toBe(true);
    expect(isInternalBackend('https://api.default.svc.cluster.local:8080')).toBe(true);
  });

  it('should return true for http:// URLs (localhost)', () => {
    expect(isInternalBackend('http://localhost:8000')).toBe(true);
    expect(isInternalBackend('http://127.0.0.1:3000')).toBe(true);
  });

  it('should return false for https:// external URLs', () => {
    expect(isInternalBackend('https://api.example.com')).toBe(false);
    expect(isInternalBackend('https://inference.sir-alfred.io')).toBe(false);
  });
});

describe('resolveAuthHeader', () => {
  const internalBackend: BackendConfig = {
    name: 'internal',
    url: 'http://localhost:8000',
    apiKey: 'internal-api-key',
    model: 'test-model',
  };

  const externalBackend: BackendConfig = {
    name: 'external',
    url: 'https://api.example.com',
    apiKey: 'backend-api-key',
    model: 'test-model',
  };

  it('should use backend API key for internal backends', () => {
    const result = resolveAuthHeader(internalBackend);
    expect(result).toBe('Bearer internal-api-key');
  });

  it('should use backend API key for internal backends even with client header', () => {
    const result = resolveAuthHeader(internalBackend, 'Bearer client-token');
    expect(result).toBe('Bearer internal-api-key');
  });

  it('should forward client auth header for external backends', () => {
    const result = resolveAuthHeader(externalBackend, 'Bearer client-jwt-token');
    expect(result).toBe('Bearer client-jwt-token');
  });

  it('should throw error for external backend without client auth', () => {
    expect(() => resolveAuthHeader(externalBackend)).toThrow(
      'Authorization header required for external backend'
    );
  });

  it('should throw error for external backend with undefined client auth', () => {
    expect(() => resolveAuthHeader(externalBackend, undefined)).toThrow(
      'Authorization header required for external backend'
    );
  });
});
