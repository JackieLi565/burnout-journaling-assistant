import express from "express";
import dotenv from "dotenv";
import usersRouter from "./routes/users.ts"
import journalsRouter from "./routes/journals.ts"

dotenv.config({ path: "../.env" });
const app = express();
app.use(express.json());

app.use("/users", usersRouter);
app.use("/journals", journalsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
