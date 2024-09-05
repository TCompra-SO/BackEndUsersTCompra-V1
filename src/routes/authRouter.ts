import { Request, Response, Router } from "express";
import {
  registerController,
  loginControllerTest,
  UpdateprofileCompanyController,
  UpdateprofileUserController,
  getNameController,
  SendCodeController,
  ValidateCodeController,
} from "../controllers/authController";

export class AuthRouter {
  private static instance: AuthRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/register", registerController);
    this.router.post("/profileCompany", UpdateprofileCompanyController);
    this.router.post("/profileUser", UpdateprofileUserController);
    this.router.post("/login", loginControllerTest);
    this.router.post("/sendCode", SendCodeController);
    this.router.get("/getName/:document", getNameController);
    this.router.post("/validate-code", ValidateCodeController);
  }

  static getRouter(): Router {
    if (!AuthRouter.instance) {
      AuthRouter.instance = new AuthRouter();
    }
    return AuthRouter.instance.router;
  }
}
