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
  getUserController,
  UpdateCompanyController,
  UpdateUserController,
  getAuthSubUserController,
  getBaseDataUserController,
  SearchCompanyController,
  RefreshTokenController,
  LogoutController,
  refreshAccessToken,
  checkIfIsSystemAdminController,
  getCsrfTokenController,
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
    this.router.post("/logout", LogoutController);

    this.router.post("/updateCompany", UpdateCompanyController);
    this.router.post("/updateUser", UpdateUserController);

    this.router.post("/sendCode", SendCodeController);
    this.router.post("/validate-code", ValidateCodeController);
    this.router.post("/newPassword", checkJwt, NewPasswordController);
    this.router.post("/sendCodeRecovery", SendCodeRecoveryController);
    this.router.post("/recoveryPassword", RecoveryPasswordController);
    this.router.post("/refreshToken", RefreshTokenController);
    this.router.post("/refreshAccessToken", refreshAccessToken);

    this.router.get("/getName/:document", getNameController);
    this.router.get("/getUser/:uid", getUserController);
    this.router.get("/getAuthSubUser/:uid", getAuthSubUserController);
    this.router.get("/getBaseDataUser/:uid", getBaseDataUserController);
    this.router.get("/searchCompany/:query", SearchCompanyController);
    this.router.get(
      "/checkIfIsSystemAdmin/:uid",
      checkIfIsSystemAdminController
    );
    this.router.get("/getCsrfToken", getCsrfTokenController);
  }

  static getRouter(): Router {
    if (!AuthRouter.instance) {
      AuthRouter.instance = new AuthRouter();
    }
    return AuthRouter.instance.router;
  }
}
