import express from 'express'
import * as controller from './controller.js'
import { authenticate, authorize } from '../../middleware/auth.js';
const router = express.Router();

router.get('/games/:gameId/products', controller.getProducts);
router.post('/games/:gameId/products', authenticate, authorize("ADMIN"), controller.createProduct);
router.put('/products/:productId', authenticate, authorize("ADMIN"), controller.updateProduct);
router.patch('/products/:productId/status', authenticate, authorize("ADMIN"), controller.toggleProduct);

export default router;