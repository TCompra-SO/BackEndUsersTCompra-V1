import { Router } from "express";
import { AuthRouter } from "./authRouter";
import { UtilRouter } from "./utilRouter";
import { SubUserRouter } from "./subUserRouter";
import { ScoreRouter } from "./scoreRouter";
import { ImageRouter } from "./imageRouter";
import { CertificateRouter } from "./certificateRouter";
import { UserMasterRouter } from "./userMasterRouter";
import { ReportsRouter } from "./reportsRouter";
import { checkJwt } from "../middleware/session";

export class RootRouter {
  private static instance: RootRouter;
  private router: Router;

  constructor() {
    this.router = Router();
    this.router.use("/v1/auth/", AuthRouter.getRouter());
    this.router.use("/v1/util/", UtilRouter.getRouter());
    this.router.use("/v1/subUser/", SubUserRouter.getRouter());
    this.router.use("/v1/score/", ScoreRouter.getRouter());
    this.router.use("/v1/image/", ImageRouter.getRouter());
    this.router.use(
      "/v1/certificate/",
      checkJwt,
      CertificateRouter.getRouter()
    );
    this.router.use("/v1/userMaster/", UserMasterRouter.getRouter());
    this.router.use("/v1/reports/", ReportsRouter.getRouter());
  }

  static getRouter(): Router {
    if (!RootRouter.instance) {
      RootRouter.instance = new RootRouter();
    }
    return RootRouter.instance.router;
  }
}
