import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app.js";

describe("Projects and proposal currency boundaries", () => {
  it("lists published projects with pagination metadata", async () => {
    const res = await request(app).get("/api/v1/projects");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body).toHaveProperty("meta");
    expect(res.body.meta).toHaveProperty("page", 1);
    expect(res.body.meta).toHaveProperty("total");
  });

  it("filters projects by currency (USD and JPY)", async () => {
    const usdRes = await request(app).get("/api/v1/projects?currency=USD");
    expect(usdRes.status).toBe(200);
    for (const project of usdRes.body.data) {
      expect(project.currency).toBe("USD");
    }

    const jpyRes = await request(app).get("/api/v1/projects?currency=JPY");
    expect(jpyRes.status).toBe(200);
    for (const project of jpyRes.body.data) {
      expect(project.currency).toBe("JPY");
    }
  });

  it("returns 404 for a non-existent project ID", async () => {
    const res = await request(app).get("/api/v1/projects/non-existent-id-12345");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("rejects project creation when unauthenticated", async () => {
    const res = await request(app).post("/api/v1/projects").send({
      title: "Test Unauthorized Project",
      description: "This project creation should be rejected because no auth token is provided.",
      budgetMinor: 50000,
      currency: "USD",
      budgetType: "FIXED"
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects proposal submission when currency does not match project currency", async () => {
    // 1. Get a USD project
    const projectsRes = await request(app).get("/api/v1/projects?currency=USD");
    expect(projectsRes.status).toBe(200);
    expect(projectsRes.body.data.length).toBeGreaterThan(0);
    const usdProject = projectsRes.body.data[0];

    // 2. Register a temporary freelancer
    const rand = Math.floor(Math.random() * 1000000);
    const freelancerRes = await request(app).post("/api/v1/auth/register").send({
      email: `freelancer-${rand}@archer.local`,
      password: "ArcherDemo123!",
      role: "FREELANCER",
      displayName: `Freelancer ${rand}`,
      username: `freelancer_${rand}`
    });
    expect(freelancerRes.status).toBe(201);
    const token = freelancerRes.body.data.accessToken;

    // 3. Attempt to submit proposal with JPY for a USD project
    const proposalRes = await request(app)
      .post(`/api/v1/proposals/projects/${usdProject.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        coverLetter: "I would like to apply for this project with the wrong currency.",
        proposedAmountMinor: 100000,
        currency: "JPY",
        estimatedDurationDays: 14
      });

    expect(proposalRes.status).toBe(400);
    expect(proposalRes.body.error.message).toMatch(/Proposal currency must match the project currency/i);
  });
});

