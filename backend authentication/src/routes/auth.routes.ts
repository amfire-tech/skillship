import { Router } from "express";
import { login, logout, refresh } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", login);
router.post("/logout", authenticate, logout);
router.post("/refresh", refresh);

export default router;
