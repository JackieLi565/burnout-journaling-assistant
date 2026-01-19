import request from "supertest";
import express from "express";
import journalsRouter from "../server/routes/journals.ts";
import usersRouter from "../server/routes/users.ts";
import { pool } from "../server/db.ts";

const app = express();
app.use(express.json());
app.use("/users", usersRouter);
app.use("/journals", journalsRouter);

let userId: string;

beforeAll(async () => {
  // Create a test user
  const res = await request(app)
    .post("/users")
    .send({ email: "testuser2@example.com", password: "secret" });
  userId = res.body.id;
});

afterAll(async () => {
  await pool.query("DELETE FROM journal_entries WHERE user_id = $1", [userId]);
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  await pool.end();
});

describe("Journals API", () => {
  it("should create a new journal entry", async () => {
    const response = await request(app)
      .post("/journals")
      .send({ user_id: userId, content: "My test journal entry" });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("entry");
    expect(response.body.entry).toHaveProperty("id");
    expect(response.body.entry).toHaveProperty("content", "My test journal entry");
    expect(response.body).toHaveProperty("bri_score");
  });

  it("should return 400 if user_id or content is missing", async () => {
    const response = await request(app).post("/journals").send({});
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("error");
  });
});
