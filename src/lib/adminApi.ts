export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export const UPLOADS_BASE = `${API_BASE}/uploads`;

const TOKEN_KEY = "adminToken";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function adminFetch(path: string, options: RequestInit = {}) {
  const token = getAdminToken();
  // FormData bodies (file uploads) must not get a manual Content-Type — the
  // browser sets one with the multipart boundary itself.
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(`Could not reach the server at ${API_BASE}. Is the backend running?`);
  }

  if (res.status === 401 && typeof window !== "undefined") {
    clearAdminToken();
    window.location.href = "/admin/login";
  }

  // A failed request that didn't come back as JSON is almost always a proxy/
  // hosting error page (HTML), not an API response — surface that clearly
  // instead of letting callers' res.json() throw a cryptic parse error.
  if (!res.ok && !res.headers.get("content-type")?.includes("application/json")) {
    throw new Error(`Server error (${res.status}). Is the backend running at ${API_BASE}?`);
  }

  return res;
}
