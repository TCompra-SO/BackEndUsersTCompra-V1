import { Request, Response, Router } from "express";
import {
  registerController,
  loginControllerTest,
  profileCompanyController,
} from "../controllers/authController";

export class AuthRouter {
  private static instance: AuthRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/register", registerController);
    this.router.post("/profileCompany", profileCompanyController);
    this.router.post("/login", loginControllerTest);
  }

  static getRouter(): Router {
    if (!AuthRouter.instance) {
      AuthRouter.instance = new AuthRouter();
    }
    return AuthRouter.instance.router;
  }
}
