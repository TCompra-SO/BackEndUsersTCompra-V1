import { Request, Response, Router } from "express";
import { UserMasterController } from "../controllers/userMasterController";

export class UserMasterRouter {
  private static instance: UserMasterRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/create", UserMasterController);
  }

  static getRouter(): Router {
    if (!UserMasterRouter.instance) {
      UserMasterRouter.instance = new UserMasterRouter();
    }
    return UserMasterRouter.instance.router;
  }
}
