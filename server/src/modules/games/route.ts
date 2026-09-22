import express from 'express'
import * as controller from './controller.js'
import { authenticate, authorize } from '../../middleware/auth.js';
const router = express.Router();

router.get('/', controller.getGames);
router.put('/:gameId', authenticate, authorize("ADMIN"), controller.updateGame);
router.patch('/:gameId/status', authenticate, authorize("ADMIN"), controller.toggleGame);
router.post('/', authenticate, authorize("ADMIN"), controller.createGame);

export default router;