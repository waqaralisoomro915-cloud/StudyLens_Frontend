let csrf = "";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = unknown>(
  path: string,
  method = "GET",
  data?: unknown,
): Promise<T> {
  if (method !== "GET" && !csrf) {
    const r = await fetch("/api/auth/csrf/", { credentials: "include" });
    csrf = (await r.json()).csrfToken;
  }
  const form = data instanceof FormData;
  const response = await fetch("/api/" + path, {
    method,
    credentials: "include",
    headers: {
      ...(form ? {} : { "Content-Type": "application/json" }),
      ...(method === "GET" ? {} : { "X-CSRFToken": csrf }),
    },
    body: data === undefined ? undefined : form ? data : JSON.stringify(data),
  });
  if (response.status === 204) return undefined as T;
  const result = await response
    .json()
    .catch(() => ({ detail: "The server could not complete this request." }));
  if (!response.ok) {
    if (response.status === 403) csrf = "";
    throw new ApiError(
      typeof result.detail === "string"
        ? result.detail
        : JSON.stringify(result),
      response.status,
    );
  }
  if (result.csrfToken) csrf = result.csrfToken;
  return result as T;
}
