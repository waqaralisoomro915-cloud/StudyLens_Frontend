import { afterEach, describe, it, expect, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});
describe("same-origin API transport", () => {
  it("bootstraps CSRF and uses the rotated login token on the next mutation", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ csrfToken: "before-login" }))
      .mockResolvedValueOnce(Response.json({ csrfToken: "after-login" }))
      .mockResolvedValueOnce(Response.json({ id: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("../../src/lib/api/client");
    await api("auth/login/", "POST", {
      username: "student",
      password: "example",
    });
    await api("courses/", "POST", { title: "Physics" });
    expect(fetchMock.mock.calls[1][1].headers["X-CSRFToken"]).toBe(
      "before-login",
    );
    expect(fetchMock.mock.calls[2][1].headers["X-CSRFToken"]).toBe(
      "after-login",
    );
    expect(fetchMock.mock.calls[2][1].credentials).toBe("include");
  });
  it("lets the browser set multipart boundaries for uploads", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ csrfToken: "token" }))
      .mockResolvedValueOnce(Response.json({ id: 2 }));
    vi.stubGlobal("fetch", fetchMock);
    const { api } = await import("../../src/lib/api/client");
    const data = new FormData();
    data.set("title", "Notes");
    await api("documents/", "POST", data);
    expect(fetchMock.mock.calls[1][1].headers["Content-Type"]).toBeUndefined();
    expect(fetchMock.mock.calls[1][1].body).toBe(data);
  });
  it("surfaces server failures instead of treating them as successful results", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ detail: "Not authorized" }, { status: 403 }),
        ),
    );
    const { api } = await import("../../src/lib/api/client");
    await expect(api("documents/42/")).rejects.toMatchObject({
      message: "Not authorized",
      status: 403,
    });
  });
});
