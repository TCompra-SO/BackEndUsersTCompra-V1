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
  resendCertifyController,
  updateRequiredDocumentsController,
  getRequiredDocuments,
  verifyCertificationController,
  searchCertificatesController,
  searchSentRequestCertificationController,
  searchReceivedRequestCertificationController,
  getCertificateRequestController,
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

    this.router.post("/resendCertify", resendCertifyController);

    this.router.post(
      "/updateRequiredDocuments",
      updateRequiredDocumentsController
    );

    this.router.post("/searchCertificates", searchCertificatesController);
    this.router.post(
      "/searchSentRequestByEntity",
      searchSentRequestCertificationController
    );
    this.router.post(
      "/searchReceivedRequestByEntity",
      searchReceivedRequestCertificationController
    );
    this.router.get("/getRequiredDocuments/:companyID", getRequiredDocuments);
    this.router.get(
      "/getCertificates/:companyID/:page/:pageSize",
      getCertificatesController
    );
    this.router.get(
      "/getCertificate/:certificateID/",
      getCertificateByIdController
    );
    this.router.get(
      "/getReceivedRequestsByEntity/:companyID/:page/:pageSize",
      getReceivedRequestsByEntityController
    );
    this.router.get(
      "/getSentRequestsByEntity/:companyID/:page/:pageSize",
      getSentRequestsByEntityController
    );

    this.router.get(
      "/deleteCertificate/:certificateID",
      deleteCertificateController
    );
    this.router.get(
      "/getCertificateRequest/:uid",
      getCertificateRequestController
    );

    this.router.get(
      "/verifyCertification/:userID/:CompanyID",
      verifyCertificationController
    );
  }

  static getRouter(): Router {
    if (!CertificateRouter.instance) {
      CertificateRouter.instance = new CertificateRouter();
    }
    return CertificateRouter.instance.router;
  }
}
