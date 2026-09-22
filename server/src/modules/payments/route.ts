import express from "express";
import * as controller from "./controller.js";

const router = express.Router();

router.post("/", controller.generateKHQR);
router.post("/verify", controller.verifyKHQRPayment);

export default router;
