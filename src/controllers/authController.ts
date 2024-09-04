import { Request, Response, response } from "express";
import { registerNewUserTEST, loginUserTEST } from "../services/authServices";
import { AuthServices } from "../services/authServices";

type ApiResponse = {
  success: boolean;
  code?: number; // code es opcional
  data?: string;
  error?: {
    msg: string;
  };
};

const getNameController = async (req: Request, res: Response) => {
  const { dni, ruc } = req.body; // Asegúrate de que estos parámetros estén en el cuerpo de la solicitud

  try {
    const responseName = await AuthServices.getNameReniec(dni, ruc);

    if (responseName.success) {
      res.status(200).send({
        success: true,
        data: responseName.data,
      });
    } else {
      const statusCode = responseName.code ?? 500;
      res.status(statusCode).send(responseName.error);
    }
  } catch (error) {
    console.error("Error en getNameController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

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
  getNameController,
};
