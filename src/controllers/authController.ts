import { Request, Response, response } from "express";
import { registerNewUserTEST, loginUserTEST } from "../services/authServices";
import { AuthServices } from "../services/authServices";

const registerController = async ({ body }: Request, res: Response) => {
  const { email, password, typeID, dni, ruc } = body;
  try {
    const responseUser = await AuthServices.RegisterNewUser(
      email,
      password,
      typeID,
      dni,
      ruc
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en RegisterController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const profileCompanyController = async ({ body }: Request, res: Response) => {
  const data = body;
  try {
    const responseUser = await AuthServices.CompleteProfileCompany(data);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en profileCompanyController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const registerControllerTest = async ({ body }: Request, res: Response) => {
  const responseUser = await registerNewUserTEST(body);
  res.send(responseUser);
};

const loginControllerTest = async ({ body }: Request, res: Response) => {
  const { email, password } = body;
  const responseUser = await loginUserTEST({ email, password });
  if (responseUser === "PASSWORD_INCORRECT") {
    res.status(403);
    res.send(responseUser);
  } else {
    res.send(responseUser);
  }
};

export {
  loginControllerTest,
  registerControllerTest,
  registerController,
  profileCompanyController,
};
