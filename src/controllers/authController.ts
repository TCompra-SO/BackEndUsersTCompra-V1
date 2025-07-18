import { Request, Response, response } from "express";
import { AuthServices } from "../services/authServices";
import { RequestExt } from "../interfaces/req-ext";
import { JwtPayload } from "jsonwebtoken";
import {
  decodeToken,
  generateRefreshAccessToken,
  generateToken,
  verifyRefreshAccessToken,
  verifyToken,
} from "../utils/jwt.handle";
import { io } from "../server"; // Importamos el objeto `io` de Socket.IO
import {
  accessTokenName,
  alternativeAccessTokenExpiresIn,
  csrfTokenName,
  refreshTokenName,
} from "../utils/Globals";
import { Console, error } from "console";
import { getCookieConfig, getCsrfCookieConfig } from "../utils/cookies.handle";
import crypto from "crypto";

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

const getUserController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await AuthServices.getEntityService(uid);
    if (responseUser.success) {
      res.status(200).send({
        success: true,
        data: responseUser.data,
      });
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.log("Error en getUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const getAuthSubUserController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await AuthServices.getAuthSubUser(uid);
    if (responseUser.success) {
      res.status(200).send({
        success: true,
        data: responseUser.data,
        typeEntity: responseUser.typeEntity,
      });
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.log("Error en getAuthSubUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const getBaseDataUserController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await AuthServices.getDataBaseUser(uid);
    if (responseUser.success) {
      res.status(200).send({
        success: true,
        data: responseUser.data,
      });
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.log("Error en getAuthSubUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const checkIfIsSystemAdminController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await AuthServices.checkIfIsSystemAdmin(uid);
    if (responseUser.success) {
      res.status(200).send({
        success: true,
        data: responseUser.data,
      });
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.log("Error en checkIfIsSystemAdminController", error);
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

const UpdateCompanyController = async ({ body }: Request, res: Response) => {
  const data = body;
  try {
    const responseUser = await AuthServices.updateCompany(data);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en updateCompanyController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const UpdateUserController = async ({ body }: Request, res: Response) => {
  const data = body;
  try {
    const responseUser = await AuthServices.UpdateUser(data);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en updateUserController", error);
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
    const { email, password, browserId } = req.body;
    const userAgent = req.headers["user-agent"] || "";
    const ipAgent: string = req.ip ?? "0.0.0.0";

    const responseUser = await AuthServices.LoginService(
      email,
      password,
      ipAgent,
      userAgent,
      browserId
    );

    if (!responseUser.success) {
      return res.status(responseUser.code).send(responseUser.error);
    } else {
      if (responseUser.res) {
        const {
          accessExpiresIn,
          refreshExpiresIn,
          accessToken,
          refreshToken,
          ...rest
        } = responseUser.res;
        return res
          .status(responseUser.code)
          .cookie(
            accessTokenName,
            accessToken,
            getCookieConfig((accessExpiresIn ?? 0) * 1000)
          )
          .cookie(
            refreshTokenName,
            refreshToken,
            getCookieConfig((refreshExpiresIn ?? 0) * 1000)
          )
          .send({
            ...responseUser,
            res: { ...rest, accessExpiresIn, refreshExpiresIn },
          });
      } else {
        throw new Error("No existe campo res en respuesta de login");
      }
    }
  } catch (error: any) {
    return res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const LogoutController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[refreshTokenName];
    const { userId } = req.body;

    // Llamamos al servicio de logout
    const response = await AuthServices.LogoutService(userId, refreshToken);

    return res
      .status(response.code)
      .clearCookie(accessTokenName, getCookieConfig())
      .clearCookie(refreshTokenName, getCookieConfig())
      .clearCookie(csrfTokenName, getCsrfCookieConfig())
      .send(response);
  } catch (error) {
    return res
      .status(500)
      .send({ success: false, msg: "Error en el servidor" });
  }
};

const RefreshTokenController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.[refreshTokenName];

    if (!refreshToken) {
      return res
        .status(401)
        .send({ success: false, msg: "No hay refresh token" });
    }

    const newAccessToken = await generateToken(refreshToken); // Genera un nuevo token de acceso

    if (newAccessToken.success) {
      const accessExpiresIn = newAccessToken.res?.accessToken
        ? decodeToken(newAccessToken.res?.accessToken)
        : alternativeAccessTokenExpiresIn;
      const refreshExpiresIn = newAccessToken.res?.refreshToken
        ? decodeToken(newAccessToken.res?.refreshToken)
        : alternativeAccessTokenExpiresIn;

      return res
        .status(200)
        .cookie(
          accessTokenName,
          newAccessToken.res?.accessToken,
          getCookieConfig(accessExpiresIn * 1000)
        )
        .cookie(
          refreshTokenName,
          newAccessToken.res?.refreshToken,
          getCookieConfig(refreshExpiresIn * 1000)
        )
        .send({
          success: true,
          accessExpiresIn,
          refreshExpiresIn,
        });
    } else return res.status(newAccessToken.code).send(newAccessToken.error);
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      success: false,
      msg: "Error al refrescar el token",
    });
  }
};

const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const accessToken = req.cookies?.[accessTokenName];
    const refreshToken = req.cookies?.[refreshTokenName];

    if (!accessToken || !refreshToken) {
      return res
        .status(400)
        .send({ success: false, msg: "No hay refresh token" });
    }

    const result: any = await generateRefreshAccessToken(
      accessToken,
      refreshToken
    );

    if (!result.success) {
      return res
        .status(result.code)
        .send({ success: result.success, msg: result.error });
    }

    const expiresIn = result.accessToken
      ? decodeToken(result.accessToken)
      : alternativeAccessTokenExpiresIn;

    return res
      .cookie(
        accessTokenName,
        result.accessToken,
        getCookieConfig(expiresIn * 1000)
      )
      .send({
        success: true,
        expiresIn,
      });
  } catch (error) {
    console.error("Error en refreshAccessToken:", error);
    return res
      .status(500)
      .send({ success: false, msg: "Error interno del servidor" });
  }
};

const NewPasswordController = async (req: RequestExt, res: Response) => {
  try {
    const { email, password } = req.body;
    const { user } = req;
    const jwtUser = user as JwtPayload;
    const userID = jwtUser.uid;
    const responseUser = await AuthServices.NewPasswordService(
      email,
      password,
      userID
    );
    if (!responseUser.success) {
      return res.status(responseUser.code).send(responseUser);
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
      return res.status(responseUser.code).send(responseUser);
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

const SearchCompanyController = async (req: Request, res: Response) => {
  const { query } = req.params;
  try {
    const responseUser = await AuthServices.getSearchCompany(query);
    if (!responseUser.success) {
      return res.status(responseUser.code).send(responseUser.error);
    }
    return res.status(responseUser.code).send(responseUser);
  } catch (error) {
    return res.status(500).send({
      success: false,
      msg: "Error interno del servidor",
    });
  }
};

const getCsrfTokenController = async (req: Request, res: Response) => {
  try {
    const csrfToken = crypto.randomBytes(32).toString("hex");
    res.cookie(csrfTokenName, csrfToken, getCsrfCookieConfig());
    res.json({ csrfToken });
  } catch (error) {
    console.log("Error en getCsrfTokenController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
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
  LogoutController,
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
  refreshAccessToken,
  checkIfIsSystemAdminController,
  getCsrfTokenController,
};
