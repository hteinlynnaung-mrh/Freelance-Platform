import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("health", () => {
  it("describes the API at the root route", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ service: "archer-api", status: "ok" });
  });

  it("reports the API is healthy", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ service: "archer-api", status: "ok" });
  });
});
