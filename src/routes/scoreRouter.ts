import { Router } from "express";
import { registerScoreController } from "../controllers/scoreController";
export class ScoreRouter {
  private static instance: ScoreRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/registerScore", registerScoreController);
  }

  static getRouter(): Router {
    if (!ScoreRouter.instance) {
      ScoreRouter.instance = new ScoreRouter();
    }
    return ScoreRouter.instance.router;
  }
}
