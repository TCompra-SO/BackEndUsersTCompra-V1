import { Request, Response, response } from "express";
import { AuthServices } from "../services/authServices";

const getNameController = async (req: Request, res: Response) => {
  // Obtener el parámetro de la consulta
  const { document } = req.params;

  // Verificar que el parámetro esté presente
  if (!document) {
    return res.status(400).send({
      success: false,
      msg: "Debe proporcionar el parámetro: document.",
    });
  }

  // Validar longitud del parámetro
  if (typeof document !== "string") {
    return res.status(400).send({
      success: false,
      msg: "El parámetro debe ser una cadena de texto.",
    });
  }

  const docLength = document.length;
  let ruc: string | undefined;
  let dni: string | undefined;

  // Determinar si es ruc o dni
  if (docLength === 11) {
    ruc = document;
  } else if (docLength === 8) {
    dni = document;
  } else {
    return res.status(400).send({
      success: false,
      msg: "El número de documento ingresado no es válido.",
    });
  }

  try {
    // Llamar al servicio correspondiente
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

const UpdateprofileCompanyController = async (
  { body }: Request,
  res: Response
) => {
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

const UpdateprofileUserController = async (
  { body }: Request,
  res: Response
) => {
  const data = body;
  try {
    const responseUser = await AuthServices.CompleteProfileUser(data);
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

const SendCodeController = async (req: Request, res: Response) => {
  try {
    const { email, type } = req.body;
    const responseUser = await AuthServices.SendCodeService(email, type);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en SendCodeController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const ValidateCodeController = async (req: Request, res: Response) => {
  try {
    const { email, code, type } = req.body;
    const responseUser = await AuthServices.ValidateCodeService(
      email,
      code,
      type
    );

    if (!responseUser.success) {
      return res.status(responseUser.code).send(responseUser.error);
    }
    return res.status(responseUser.code).send(responseUser.res);
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const LoginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const responseUser = await AuthServices.LoginService(email, password);

    if (!responseUser.success) {
      return res.status(responseUser.code).send(responseUser.error);
    }
    return res.status(responseUser.code).send(responseUser.res);
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const NewPasswordController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const responseUser = await AuthServices.NewPasswordService(email, password);
    if (!responseUser.success) {
      return res.status(responseUser.code).send(responseUser.error);
    }
    return res.status(responseUser.code).send(responseUser.res);
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      msg: "Error interno del servidor",
    });
  }
};

const SendCodeRecoveryController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const responseUser = await AuthServices.SendCodeRecovery(email);
    if (!responseUser.success) {
      return res.status(responseUser.code).send(responseUser.error);
    }
    return res.status(responseUser.code).send(responseUser.res);
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      msg: "Error interno del servidor",
    });
  }
};

const RecoveryPasswordController = async (req: Request, res: Response) => {
  try {
    const { email, code, password } = req.body;
    const responseUser = await AuthServices.RecoveryPassword(
      email,
      code,
      password
    );
    if (!responseUser.success) {
      return res.status(responseUser.code).send(responseUser.error);
    }
    return res.status(responseUser.code).send(responseUser.res);
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      msg: "Error interno del servidor",
    });
  }
};

export {
  registerController,
  UpdateprofileCompanyController,
  UpdateprofileUserController,
  getNameController,
  SendCodeController,
  ValidateCodeController,
  LoginController,
  NewPasswordController,
  SendCodeRecoveryController,
  RecoveryPasswordController,
};
