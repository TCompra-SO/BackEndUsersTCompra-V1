import multer from "multer";
import { uploadAvatarController, upload } from "../controllers/imageController";
import { Router } from "express";
import fs from "fs";
import path from "path";

export class ImageRouter {
  private static instance: ImageRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    // Rutas de la API
    this.router.post(
      "/upload-avatar",
      upload.single("image"),
      uploadAvatarController
    );
  }

  static getRouter(): Router {
    if (!ImageRouter.instance) {
      ImageRouter.instance = new ImageRouter();
    }
    return ImageRouter.instance.router;
  }
}
