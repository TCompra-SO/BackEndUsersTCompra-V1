import { Request, Response, Router } from "express";
import { listCountries } from "../controllers/countryController";
import { listCategories } from "../controllers/categoryController";
import { listUserRoles } from "../controllers/userRolesController";
import {
  getLastRecordsController,
  getUtilDataController,
} from "../controllers/ultilDataController";
export class UtilRouter {
  private static instance: UtilRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.get("/countries/:id?", listCountries);
    this.router.get("/categories", listCategories);
    this.router.get("/userRoles", listUserRoles);
    this.router.get("/utilData/:namedata", getUtilDataController);
    this.router.post("/getLastRecords", getLastRecordsController);
  }

  static getRouter(): Router {
    if (!UtilRouter.instance) {
      UtilRouter.instance = new UtilRouter();
    }
    return UtilRouter.instance.router;
  }
}
