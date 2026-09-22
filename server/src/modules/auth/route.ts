import * as controller from "./controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import express from "express";
const router = express.Router();

router.post('/register',controller.register);
router.post('/login', controller.login);
router.post('/logout', controller.logOut);
router.get('/me', authenticate, controller.checkAuth);

export default router;