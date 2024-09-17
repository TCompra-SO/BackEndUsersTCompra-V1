import { Request, Response, Router } from "express";
import {
  registerSubUserController,
  getSubUserController,
} from "../controllers/subUserController";
import { checkJwt } from "../middleware/session";

export class SubUserRouter {
  private static instance: SubUserRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/register", registerSubUserController);
    this.router.get("/:uid", checkJwt, getSubUserController);
  }

  static getRouter(): Router {
    if (!SubUserRouter.instance) {
      SubUserRouter.instance = new SubUserRouter();
    }
    return SubUserRouter.instance.router;
  }
}
