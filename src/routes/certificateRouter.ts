import { Router } from "express";
import {
  uploadCertificateController,
  upload,
  getCertificatesController,
  getCertificateByIdController,
  sendCertificationController,
  updateSentCertificateStatusController,
  updateCertifyStateController,
} from "../controllers/certificateController";
import multer from "multer";

export class CertificateRouter {
  private static instance: CertificateRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    // Rutas de la API
    this.router.post("/uploadCertificate", upload, uploadCertificateController);
    this.router.post("/sendCertification", sendCertificationController);
    this.router.post(
      "/updateSentCertificateState",
      updateSentCertificateStatusController
    );
    this.router.post("/updateCertifyState", updateCertifyStateController);

    this.router.get("/getCertificates/:companyID", getCertificatesController);
    this.router.get(
      "/getCertificate/:certificateID",
      getCertificateByIdController
    );
  }

  static getRouter(): Router {
    if (!CertificateRouter.instance) {
      CertificateRouter.instance = new CertificateRouter();
    }
    return CertificateRouter.instance.router;
  }
}
