import {
  JsonWebTokenError,
  sign,
  TokenExpiredError,
  verify,
  decode,
} from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { AuthServices } from "../services/authServices";
import CompanyModel from "../models/companyModel";
import { pipeline } from "stream";
import { TypeEntity } from "../types/globalTypes";
import UserModel from "../models/userModel";
import { accessTokenExpiresIn, refreshTokenExpiresIn } from "./Globals";
import SessionModel from "../models/sessionModel";
import { error } from "console";

const JWT_SECRET = process.env.JWT_SECRET || "token.01010101";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh.01010101";

const generateToken = async (prevRefreshToken: string) => {
  const decoded: any = verifyRefreshAccessToken(prevRefreshToken);

  if (!decoded)
    return {
      success: false,
      code: 401,
      error: {
        msg: "El Refresh Token es invalido",
      },
    };

  const sessionData = await SessionModel.findOne({
    userId: decoded.uid,
    refreshToken: prevRefreshToken,
  });

  if (prevRefreshToken !== sessionData?.refreshToken) {
    return {
      success: false,
      code: 401,
      error: {
        msg: "El Refresh Token es invalido",
      },
    };
  }

  const accessToken = sign({ uid: decoded.uid }, JWT_SECRET, {
    expiresIn: accessTokenExpiresIn,
  });
  const refreshToken = sign({ uid: decoded.uid }, JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenExpiresIn,
  });

  if (sessionData) {
    const response = await SessionModel.updateOne(
      { userId: sessionData.userId, refreshToken: prevRefreshToken }, // Filtrar por Uid dentro del array
      {
        $set: {
          accessToken,
          refreshToken,
        },
      } // Actualizar accessToken
    );
    if (response.modifiedCount < 1) {
      return {
        success: false,
        code: 407,
        error: {
          msg: "No se pudo actualizar el Token en la base de datos",
        },
      };
    }
  } else {
    return {
      success: false,
      code: 403,
      error: {
        msg: "No se encontro la sesion",
      },
    };
  }

  return {
    success: true,
    code: 200,
    res: {
      accessToken,
      refreshToken,
    },
  };
};

const verifyToken = async (token: string) => {
  try {
    const decoded = verify(token, JWT_SECRET) as { uid: string };
    return { valid: true, expired: false, decoded };
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      return { valid: false, expired: true, decoded: null };
    }

    console.error("Error al verificar access token:", error);
    return { valid: false, expired: false, decoded: null };
  }
};

function validateAccessToken(accessToken: string): {
  valid: boolean;
  expired: boolean;
  uid: string | null;
  error?: Error;
} {
  try {
    const decoded: any = jwt.verify(accessToken, JWT_SECRET, {
      ignoreExpiration: true,
    });

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const expired = decoded.exp ? decoded.exp < now : false;

    return {
      valid: true,
      expired,
      uid: typeof decoded.uid === "string" ? decoded.uid : null,
    };
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return {
        valid: false,
        expired: false,
        uid: null,
        error,
      };
    } else {
      return {
        valid: false,
        expired: false,
        uid: null,
        error: new Error("Unknown error"),
      };
    }
  }
}

const generateRefreshAccessToken = async (
  accessToken: string,
  refreshToken: string
) => {
  try {
    const decoded = validateAccessToken(accessToken);
    // const decoded = verify(accessToken, JWT_SECRET) as { uid: string };

    if (decoded.valid && decoded.uid) {
      const userData = await AuthServices.getDataBaseUser(decoded.uid);

      const sessionData = await SessionModel.findOne({
        userId: decoded.uid,
        refreshToken,
      });
      if (!sessionData) {
        return {
          success: false,
          code: 409,
          error: {
            msg: "No se encontraron datos, verifique el RefreshToken",
          },
        };
      }
      const refreshTokenVerify = verifyRefreshAccessToken(refreshToken);

      if (refreshTokenVerify?.expired) {
        return {
          success: false,
          code: 410,
          error: {
            msg: "El RefreshToken ha expirado",
          },
        };
      }
      if (accessToken !== sessionData?.accessToken) {
        // userData.data?.[0].auth_users.refreshToken
        return {
          success: false,
          code: 400,
          error: {
            msg: "El Access Token es invalido",
          },
        };
      }

      /* const decodedRefreshToken = verify(refreshToken, JWT_REFRESH_SECRET) as {
        uid: string;
      };*/
      const newAccessToken = sign({ uid: decoded.uid }, JWT_SECRET, {
        expiresIn: accessTokenExpiresIn,
      });

      if (sessionData) {
        const response = await SessionModel.updateOne(
          { userId: sessionData.userId, refreshToken }, // Filtrar por Uid dentro del array
          { $set: { accessToken: newAccessToken } } // Actualizar accessToken
        );

        if (response.modifiedCount < 1) {
          return {
            success: false,
            code: 403,
            error: {
              msg: "No se ha podido actualizar el token en la BD",
            },
          };
        }
      }
      return {
        success: true,
        accessToken: newAccessToken,
      };
    } else {
      return {
        success: false,
        code: 401,
        error: {
          msg: "Access Token invalido",
        },
      };
    }
  } catch (error) {
    console.error("Error al generar nuevo access token:", error);
    return { success: false, msg: "Error al generar nuevo access token" };
  }
};

const verifyRefreshAccessToken = (
  token: string
): { uid: string; expired?: boolean } | null => {
  try {
    // Verifica normalmente primero
    return verify(token, JWT_REFRESH_SECRET) as { uid: string };
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      // El token está expirado: decodifica manualmente para obtener el uid
      const decoded = decode(token) as { uid: string } | null;
      if (decoded && decoded.uid) {
        return { uid: decoded.uid, expired: true }; // indicamos que está expirado
      }
    }

    // Otros errores (token mal formado, clave incorrecta, etc.)
    // console.error("Error al verificar refresh token:", error);
    return null;
  }
};

const decodeToken = (token: string): number => {
  const decoded: any = jwt.decode(token);

  if (decoded && decoded.exp) {
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    return Math.max(expiresIn); // Nunca negativo
  }

  return 0; // Token inválido o sin expiración
};
export {
  generateToken,
  verifyToken,
  generateRefreshAccessToken,
  verifyRefreshAccessToken,
  decodeToken,
};
