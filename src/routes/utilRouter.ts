import { Request, Response, Router } from "express";
import { listCountries } from "../controllers/countryController";
import { listCategories } from "../controllers/categoryController";

export class UtilRouter {
  private static instance: UtilRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.get("/countries/:id?", listCountries);
    this.router.get("/categories", listCategories);
  }

  static getRouter(): Router {
    if (!UtilRouter.instance) {
      UtilRouter.instance = new UtilRouter();
    }
    return UtilRouter.instance.router;
  }
}
