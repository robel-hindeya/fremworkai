/**
 * Type-safe API client for Fremwork backend
 * Fully integrated with NestJS 10 API, Supabase Auth tokens, and Workspace headers
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public field?: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// In browser, relative /v1/... is proxied by Next.js rewrites to http://localhost:4000/v1
// Or direct env NEXT_PUBLIC_API_URL can be provided.
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window === 'undefined' ? (process.env.INTERNAL_API_URL || 'http://localhost:4000') : '');

function normalizeEndpoint(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  let clean = path;
  if (clean.startsWith('/api/')) {
    clean = clean.replace(/^\/api\//, '/v1/');
    // Handle alias mappings
    if (clean.startsWith('/v1/scheduled')) {
      clean = clean.replace('/v1/scheduled', '/v1/tasks');
    }
    if (clean.startsWith('/v1/chat')) {
      clean = clean.replace('/v1/chat', '/v1/conversations');
    }
  } else if (!clean.startsWith('/v1/')) {
    clean = `/v1/${clean.replace(/^\//, '')}`;
  }

  return BASE_URL ? `${BASE_URL}${clean}` : clean;
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fremwork_token') : null;
  const wsId = typeof window !== 'undefined' ? localStorage.getItem('fremwork_workspace_id') : null;

  return {
    Authorization: token ? `Bearer ${token}` : 'Bearer mock-token',
    'X-Workspace-Id': wsId || 'default-workspace-harbor-pine',
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = normalizeEndpoint(path);
  const headers = new Headers(options.headers || {});

  // Add default content type if payload present
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  // Inject multi-tenancy and auth headers
  const authHeaders = getAuthHeaders() as Record<string, string>;
  for (const [k, v] of Object.entries(authHeaders)) {
    if (!headers.has(k)) {
      headers.set(k, v);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorDetails = json.error || {};
    const message =
      typeof errorDetails === 'string'
        ? errorDetails
        : errorDetails.message || json.message || res.statusText || 'Request failed';
    const code = errorDetails.code || 'api_error';
    const field = errorDetails.field;

    throw new ApiError(res.status, message, code, field, json);
  }

  // Unwrap response data if wrapped in Fremwork envelope
  return json.data !== undefined ? json.data : json;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  /**
   * Server-Sent Events (SSE) Stream client for AI conversation answers
   */
  stream: async (
    path: string,
    body: any,
    callbacks: {
      onMeta?: (meta: any) => void;
      onBlock?: (block: any) => void;
      onDone?: (info: any) => void;
      onError?: (err: any) => void;
    },
  ) => {
    const url = normalizeEndpoint(path);
    const headers = new Headers(getAuthHeaders());
    headers.set('Content-Type', 'application/json');

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`SSE stream request failed with status ${res.status}`);
      }

      if (!res.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          const lines = evt.split('\n');
          let eventName = 'message';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (eventData) {
            try {
              const parsed = JSON.parse(eventData);
              if (eventName === 'meta' && callbacks.onMeta) {
                callbacks.onMeta(parsed);
              } else if (eventName === 'block' && callbacks.onBlock) {
                callbacks.onBlock(parsed);
              } else if (eventName === 'done' && callbacks.onDone) {
                callbacks.onDone(parsed);
              }
            } catch (e) {
              console.warn('Failed to parse SSE payload:', eventData);
            }
          }
        }
      }
    } catch (err) {
      if (callbacks.onError) callbacks.onError(err);
      else console.error('SSE Error:', err);
    }
  },
};
