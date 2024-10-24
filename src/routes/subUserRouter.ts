import { Request, Response, Router } from "express";
import {
  registerSubUserController,
  getSubUserController,
  updateSubUserController,
  changeStatusController,
  changeRoleController,
} from "../controllers/subUserController";
import { checkJwt } from "../middleware/session";

export class SubUserRouter {
  private static instance: SubUserRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/register", registerSubUserController);
    this.router.post("/update", updateSubUserController);
    this.router.post("/changeStatus", changeStatusController);
    this.router.post("/changeRole", changeRoleController);
    this.router.get("/getUser/:uid", getSubUserController);
  }

  static getRouter(): Router {
    if (!SubUserRouter.instance) {
      SubUserRouter.instance = new SubUserRouter();
    }
    return SubUserRouter.instance.router;
  }
}
