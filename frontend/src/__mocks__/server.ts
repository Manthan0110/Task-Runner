// src/__mocks__/server.ts
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Handlers define mock API responses
export const handlers = [
  // Mock GET /api/tasks
  http.get("/api/tasks", () => {
    return HttpResponse.json([
      {
        id: 1,
        url: "http://example.com",
        method: "GET",
        enabled: true,
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  // Mock POST /api/tasks
  http.post("/api/tasks", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    // Ensure only objects can be spread
    const task = {
      id: Math.floor(Math.random() * 1000),
      ...(typeof body === "object" && body !== null ? body : {}),
      created_at: new Date().toISOString(),
    };

    return HttpResponse.json(task);
  }),
];

// Create the mock server
export const server = setupServer(...handlers);
