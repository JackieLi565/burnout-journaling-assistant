import { Router } from "express";
import { createUser } from "../controllers/users.ts";

const router = Router();

router.post("/", async (req, res) => {
  await createUser(req, res);
});

export default router;
