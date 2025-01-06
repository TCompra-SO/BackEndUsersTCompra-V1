import { Router } from "express";
import { getCountsByEntityController } from "../controllers/reportController";

export class ReportsRouter {
  private static instance: ReportsRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.get("/getCountsByEntity/:uid", getCountsByEntityController);
  }

  static getRouter(): Router {
    if (!ReportsRouter.instance) {
      ReportsRouter.instance = new ReportsRouter();
    }
    return ReportsRouter.instance.router;
  }
}
