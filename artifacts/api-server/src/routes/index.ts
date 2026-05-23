import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import jobsRouter from "./jobs.js";
import disputesRouter from "./disputes.js";
import financeRouter from "./finance.js";
import chatRouter from "./chat.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/jobs", jobsRouter);
router.use("/disputes", disputesRouter);
router.use("/finance", financeRouter);
router.use("/chat", chatRouter);

export default router;
