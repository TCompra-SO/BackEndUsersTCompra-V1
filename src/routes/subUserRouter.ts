import { Request, Response, Router } from "express";
import { registerSubUserController } from "../controllers/subUserController";

export class SubUserRouter {
  private static instance: SubUserRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/register", registerSubUserController);
  }

  static getRouter(): Router {
    if (!SubUserRouter.instance) {
      SubUserRouter.instance = new SubUserRouter();
    }
    return SubUserRouter.instance.router;
  }
}
