/**
 * FastShopBD API Client
 * Central HTTP client with environment configuration, token authorization,
 * error normalization, and fallback capability.
 */

function getApiBaseUrl(): string {
  // Browser requests use the shared public domain and Vercel's /api rewrite.
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }

  // Server-side requests use the private Vercel service binding at runtime.
  // NEXT_PUBLIC_API_URL remains as a compatibility fallback for other hosts.
  const envUrl =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:4000';
  const trimmed = envUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/api/v1') ? trimmed : `${trimmed}/api/v1`;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code = 'API_ERROR', status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const apiBase = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;

  // Get token from storage or context if available
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('fastshop_auth_token');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorData: ApiResponse<null>['error'];
      try {
        const json = await res.json();
        errorData = json.error;
      } catch {
        errorData = {
          code: `HTTP_${res.status}`,
          message: res.statusText || 'Network request failed',
        };
      }
      throw new ApiError(
        errorData?.message || 'Something went wrong',
        errorData?.code || `HTTP_${res.status}`,
        res.status,
        errorData?.details,
      );
    }

    const json = (await res.json()) as ApiResponse<T>;
    return json.data !== undefined ? json.data : (json as unknown as T);
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Network connection failed';
    throw new ApiError(message, 'NETWORK_ERROR', 0);
  }
}
