import { Request, Response, Router } from "express";
import {
  registerController,
  LoginController,
  UpdateprofileCompanyController,
  UpdateprofileUserController,
  getNameController,
  SendCodeController,
  ValidateCodeController,
  NewPasswordController,
  SendCodeRecoveryController,
  RecoveryPasswordController,
} from "../controllers/authController";
import { checkJwt } from "../middleware/session";

export class AuthRouter {
  private static instance: AuthRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/register", registerController);
    this.router.post("/profileCompany", UpdateprofileCompanyController);
    this.router.post("/profileUser", UpdateprofileUserController);
    this.router.post("/login", LoginController);
    this.router.post("/sendCode", SendCodeController);
    this.router.post("/validate-code", ValidateCodeController);
    this.router.post("/newPassword", checkJwt, NewPasswordController);
    this.router.post("/sendCodeRecovery", SendCodeRecoveryController);
    this.router.post("/recoveryPassword", RecoveryPasswordController);

    this.router.get("/getName/:document", getNameController);
  }

  static getRouter(): Router {
    if (!AuthRouter.instance) {
      AuthRouter.instance = new AuthRouter();
    }
    return AuthRouter.instance.router;
  }
}
