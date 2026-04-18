import { Router } from "express";
import { createUser } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/", authenticate, createUser);

export default router;
