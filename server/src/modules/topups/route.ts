import express from 'express';
import * as controller from './controller.js'
import { authenticate, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.get("/my", authenticate, controller.getUserTopUps);
router.get("/", authenticate, authorize("ADMIN"), controller.getTopUps);

export default router;