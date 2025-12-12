import type { BackendConfig } from '../types/index.js';

/**
 * Check if backend URL is internal (cluster-local or localhost)
 */
export function isInternalBackend(url: string): boolean {
  return url.includes('.cluster.local') || url.startsWith('http://');
}

/**
 * Resolve the authorization header for a backend request
 * - Internal backends: use configured API key
 * - External backends: forward client auth header (required)
 */
export function resolveAuthHeader(backend: BackendConfig, clientAuthHeader?: string): string {
  if (isInternalBackend(backend.url)) {
    return `Bearer ${backend.apiKey}`;
  }
  if (!clientAuthHeader) {
    throw new Error('Authorization header required for external backend');
  }
  return clientAuthHeader;
}
