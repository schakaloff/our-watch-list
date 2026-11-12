// A small wrapper around fetch for calling our backend.
// For anything that changes data (POST, PUT, PATCH, DELETE) it adds the CSRF token the backend requires.

// Reads the XSRF-TOKEN cookie the backend gives us on every GET request.
function csrfToken(): string {
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

interface Options {
  method?: string;
  body?: unknown;
}

// Sends a request to the backend. Pass a body as a plain object and it is sent as JSON.
export function apiFetch(path: string, options: Options = {}): Promise<Response> {
  const method = options.method ?? "GET";
  const headers: Record<string, string> = {};

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (method !== "GET") {
    headers["X-XSRF-TOKEN"] = csrfToken();
  }

  return fetch(path, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}
