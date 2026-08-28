const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let accessToken: string | null = null;
let refreshToken: string | null = null;

export function setSessionTokens(tokens: { accessToken: string; refreshToken: string } | null) {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
  if (tokens) {
    localStorage.setItem("winn_refresh_token", tokens.refreshToken);
  } else {
    localStorage.removeItem("winn_refresh_token");
  }
}

export function getStoredRefreshToken(): string | null {
  return refreshToken ?? localStorage.getItem("winn_refresh_token");
}

async function rawRequest(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init.headers,
    },
  });
}

async function tryRefresh(): Promise<boolean> {
  const storedRefresh = getStoredRefreshToken();
  if (!storedRefresh) return false;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: storedRefresh }),
  });
  if (!res.ok) return false;

  const data = await res.json();
  setSessionTokens(data);
  return true;
}

/** Every module's API calls go through this — one place that attaches
 *  auth headers, retries once on an expired token, and formats errors. */
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };

  let res = await rawRequest(path, init);

  if (res.status === 401 && (await tryRefresh())) {
    res = await rawRequest(path, init);
  }

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new ApiError(res.status, payload?.error?.message ?? "Request failed", payload?.error?.code);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
