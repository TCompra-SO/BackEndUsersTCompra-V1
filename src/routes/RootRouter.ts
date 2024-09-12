import { Router } from "express";
import { AuthRouter } from "./authRouter";
import { UtilRouter } from "./utilRouter";
import { SubUserRouter } from "./subUserRouter";
export class RootRouter {
  private static instance: RootRouter;
  private router: Router;

  constructor() {
    this.router = Router();
    this.router.use("/v1/auth/", AuthRouter.getRouter());
    this.router.use("/v1/util/", UtilRouter.getRouter());
    this.router.use("/v1/subUser/", SubUserRouter.getRouter());
  }

  static getRouter(): Router {
    if (!RootRouter.instance) {
      RootRouter.instance = new RootRouter();
    }
    return RootRouter.instance.router;
  }
}
