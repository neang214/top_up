import express from "express";
import * as controller from "./controller.js";

const router = express.Router();

router.post("/", controller.generateKHQR);
router.post("/verify", controller.verifyKHQRPayment);
router.post(
    "/payway/callback",
    express.urlencoded({ extended: false }),
    controller.paywayCallback
);

export default router;
