import type { Request, Response } from "express";
import { pool } from "../db.ts";
import fetch from "node-fetch";

// Create a new journal entry
export async function createJournal(req: Request, res: Response) {
  const { user_id, content } = req.body;
  if (!user_id || !content)
    return res.status(400).json({ error: "Missing user_id or content" });

  try {
    const result = await pool.query(
      "INSERT INTO journal_entries (user_id, content) VALUES ($1, $2) RETURNING id, content, created_at",
      [user_id, content]
    );
    const entry = result.rows[0];

    let bri_score: number | null = null;
    try {
      const response = await fetch(process.env.PYTHON_ANALYSIS_URL as string, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: content }),
      });
      const data = await response.json();
      bri_score = data.score;
    } catch (err: any) {
      console.warn("Python analysis failed:", err.message);
    }

    res.status(201).json({ entry, bri_score });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
}
