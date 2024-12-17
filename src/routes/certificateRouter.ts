import { Router } from "express";
import {
  uploadCertificateController,
  upload,
  getCertificatesController,
  getCertificateByIdController,
  sendCertificationController,
  updateSentCertificateStatusController,
  updateCertifyStateController,
  getReceivedRequestsByEntityController,
  deleteCertificateController,
} from "../controllers/certificateController";
import multer from "multer";
import { getSentRequestsByEntityController } from "../controllers/certificateController";

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
    this.router.get(
      "/getReceivedRequestsByEntity/:companyID",
      getReceivedRequestsByEntityController
    );
    this.router.get(
      "/getSentRequestsByEntity/:companyID",
      getSentRequestsByEntityController
    );

    this.router.get(
      "/deleteCertificate/:certificateID",
      deleteCertificateController
    );
  }

  static getRouter(): Router {
    if (!CertificateRouter.instance) {
      CertificateRouter.instance = new CertificateRouter();
    }
    return CertificateRouter.instance.router;
  }
}
