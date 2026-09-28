import express from "express";
import * as controller from "./controller.js";
import { uploadImage } from "../../middleware/upload.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", controller.getGames);

router.put(
    "/:gameId",
    authenticate,
    authorize("ADMIN"),
    uploadImage.single("image"),
    controller.updateGame
);

router.patch(
    "/:gameId/status",
    authenticate,
    authorize("ADMIN"),
    controller.toggleGame
);

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    uploadImage.single("image"),
    controller.createGame
);

export default router;