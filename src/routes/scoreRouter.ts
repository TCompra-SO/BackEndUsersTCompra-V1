import { Router } from "express";
import {
  getScoreCountController,
  registerScoreController,
} from "../controllers/scoreController";
import { checkJwt } from "../middleware/session";
export class ScoreRouter {
  private static instance: ScoreRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/registerScore", registerScoreController);

    this.router.get("/getScoreCount/:uid", getScoreCountController);
  }

  static getRouter(): Router {
    if (!ScoreRouter.instance) {
      ScoreRouter.instance = new ScoreRouter();
    }
    return ScoreRouter.instance.router;
  }
}
