import request from "supertest";
import express from "express";
import usersRouter from "../server/routes/users.ts";
import { pool } from "../server/db.ts";

// Setup Express app for testing
const app = express();
app.use(express.json());
app.use("/users", usersRouter);

describe("Users API", () => {
  afterAll(async () => {
    // Clean up test data
    await pool.query("DELETE FROM users WHERE email LIKE 'testuser%@example.com'");
    await pool.end();
  });

  it("should create a new user", async () => {
    const response = await request(app)
      .post("/users")
      .send({ email: "testuser1@example.com", password: "secret" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("id");
    expect(response.body).toHaveProperty("email", "testuser1@example.com");
    expect(response.body).toHaveProperty("created_at");
  });

  it("should return 400 if email or password is missing", async () => {
    const response = await request(app).post("/users").send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
