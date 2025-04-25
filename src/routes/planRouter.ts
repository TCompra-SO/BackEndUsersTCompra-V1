import { Router } from "express";
import {
  createPlanController,
  getAllPlansController,
  getPlanByIdController,
} from "../controllers/planController";
import { registerUserPlanController } from "../controllers/planController";

export class PlanRouter {
  private static instance: PlanRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/create", createPlanController);
    this.router.post("/registerUserPlan", registerUserPlanController);
    this.router.get("/getAllPlans", getAllPlansController);
    this.router.get("/getPlanById/:planId", getPlanByIdController);
  }

  static getRouter(): Router {
    if (!PlanRouter.instance) {
      PlanRouter.instance = new PlanRouter();
    }
    return PlanRouter.instance.router;
  }
}
