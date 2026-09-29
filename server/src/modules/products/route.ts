import express from "express";
import * as controller from "./controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { uploadImage } from "../../middleware/upload.js";
const router = express.Router();

router.get("/games/:gameId/products", controller.getProducts);

router.post(
    "/games/:gameId/products",
    authenticate,
    authorize("ADMIN"),
    uploadImage.single("image"),
    controller.createProduct,
);
router.put(
    "/:productId",
    authenticate,
    authorize("ADMIN"),
    uploadImage.single("image"),
    controller.updateProduct
);
router.patch(
    "/products/:productId/status",
    authenticate,
    authorize("ADMIN"),
    controller.toggleProduct,
);

export default router;
