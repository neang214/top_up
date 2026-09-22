import express from "express";
import { authenticate, authorize } from "../../middleware/auth.js";
import * as controller from "./controller.js";

const router = express.Router();

router.post("/", controller.createOrder);

router.get("/my", authenticate, controller.getMyOrders);

router.get("/", authenticate, authorize("ADMIN"), controller.getOrders);

router.get("/:id", controller.getOrder);

export default router;