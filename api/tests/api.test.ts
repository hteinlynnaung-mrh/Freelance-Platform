import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("API request boundaries", () => {
  it("rejects protected requests without an access token", async () => {
    const response = await request(app).get("/api/v1/auth/me");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns structured validation errors", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({ email: "not-an-email" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.fieldErrors).toHaveProperty("email");
  });

  it("requires an email or username to sign in", async () => {
    const response = await request(app).post("/api/v1/auth/login").send({ password: "ArcherDemo123!" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.fieldErrors).toHaveProperty("username");
  });

  it("rejects malformed usernames at registration", async () => {
    const response = await request(app).post("/api/v1/auth/register").send({
      email: "new-user@archer.local",
      password: "ArcherDemo123!",
      role: "CLIENT",
      displayName: "New User",
      username: "not a username"
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.details.fieldErrors).toHaveProperty("username");
  });

  it("rejects deleting account without an access token", async () => {
    const response = await request(app).delete("/api/v1/auth/me");
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHORIZED");
  });

  it("registers a user, rejects deletion with invalid password, and successfully deletes the account", async () => {
    const registerRes = await request(app).post("/api/v1/auth/register").send({
      email: "delete-me@archer.local",
      password: "ArcherDemo123!",
      role: "CLIENT",
      displayName: "Delete Test User",
      username: "delete_test_user"
    });
    expect(registerRes.status).toBe(201);
    const token = registerRes.body.data.accessToken;

    // Reject wrong password
    const wrongPassRes = await request(app)
      .delete("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "WrongPassword999!" });
    expect(wrongPassRes.status).toBe(401);

    // Delete with correct password
    const deleteRes = await request(app)
      .delete("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: "ArcherDemo123!" });
    expect(deleteRes.status).toBe(204);

    // Subsequent /auth/me should fail
    const meRes = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(meRes.status).toBe(401);
  });
});

