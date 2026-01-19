import { Router } from "express";
import { createJournal } from "../controllers/journals.ts";

const router = Router();

router.post("/", async (req, res) => {
  await createJournal(req, res);
});

export default router;
