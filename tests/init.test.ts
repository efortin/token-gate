import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkBackendHealth, discoverModel, getAvailableModels, clearModelCache } from '../src/init.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('checkBackendHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearModelCache();
  });

  it('should succeed when health endpoint returns 200', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });

    await expect(checkBackendHealth('http://localhost:8000', 'test')).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/health',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should succeed when health endpoint returns 401', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 });

    await expect(checkBackendHealth('http://localhost:8000', 'test')).resolves.toBeUndefined();
  });

  it('should try models endpoint if health fails', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValueOnce({ ok: true, status: 200 });

    await expect(checkBackendHealth('http://localhost:8000', 'test')).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(
      'http://localhost:8000/v1/models',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('should throw if all endpoints fail', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockRejectedValueOnce(new Error('Connection refused'));

    await expect(checkBackendHealth('http://localhost:8000', 'test'))
      .rejects.toThrow('Backend test unreachable at http://localhost:8000');
  });

  it('should throw if endpoints return non-ok status', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: false, status: 503 });

    await expect(checkBackendHealth('http://localhost:8000', 'test'))
      .rejects.toThrow('Backend test unreachable');
  });
});

describe('discoverModel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearModelCache();
  });

  it('should discover model from backend', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 'llava-v1.6' }] }),
    });

    const model = await discoverModel('http://localhost:8000');
    expect(model).toBe('llava-v1.6');
  });

  it('should return cached model on subsequent calls', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 'llava-v1.6' }] }),
    });

    const model1 = await discoverModel('http://localhost:8000');
    const model2 = await discoverModel('http://localhost:8000');

    expect(model1).toBe('llava-v1.6');
    expect(model2).toBe('llava-v1.6');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return null if no models available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const model = await discoverModel('http://localhost:8000');
    expect(model).toBeNull();
  });

  it('should return null on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const model = await discoverModel('http://localhost:8000');
    expect(model).toBeNull();
  });

  it('should return null on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const model = await discoverModel('http://localhost:8000');
    expect(model).toBeNull();
  });

  it('should include auth header when apiKey provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 'model-1' }] }),
    });

    await discoverModel('http://localhost:8000', 'my-api-key');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8000/v1/models',
      expect.objectContaining({
        headers: { Authorization: 'Bearer my-api-key' },
      })
    );
  });
});

describe('getAvailableModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return list of available models', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [{ id: 'model-1' }, { id: 'model-2' }] }),
    });

    const models = await getAvailableModels('http://localhost:8000');
    expect(models).toEqual(['model-1', 'model-2']);
  });

  it('should return empty array on error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const models = await getAvailableModels('http://localhost:8000');
    expect(models).toEqual([]);
  });

  it('should return empty array on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const models = await getAvailableModels('http://localhost:8000');
    expect(models).toEqual([]);
  });

  it('should return empty array when no models', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const models = await getAvailableModels('http://localhost:8000');
    expect(models).toEqual([]);
  });
});
