import { Request, Response, Router } from "express";
import {
  registerSubUserController,
  getSubUserController,
  updateSubUserController,
  changeStatusController,
  changeRoleController,
  getSubUsersByEntity,
  searchSubUserController,
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
    this.router.post("/searchSubUser", searchSubUserController);
    this.router.get("/getUser/:uid", getSubUserController);
    this.router.get(
      "/getSubUsersByEntity/:uid/:page/:limit",
      getSubUsersByEntity
    );
  }

  static getRouter(): Router {
    if (!SubUserRouter.instance) {
      SubUserRouter.instance = new SubUserRouter();
    }
    return SubUserRouter.instance.router;
  }
}
