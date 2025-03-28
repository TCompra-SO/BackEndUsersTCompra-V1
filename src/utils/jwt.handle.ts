import {
  JsonWebTokenError,
  sign,
  TokenExpiredError,
  verify,
} from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { AuthServices } from "../services/authServices";
import CompanyModel from "../models/companyModel";
import { pipeline } from "stream";
import { TypeEntity } from "../types/globalTypes";
import UserModel from "../models/userModel";
import { accessTokenExpiresIn, refreshTokenExpiresIn } from "./Globals";

const JWT_SECRET = process.env.JWT_SECRET || "token.01010101";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh.01010101";

const generateToken = async (uid: string) => {
  const accessToken = sign({ uid }, JWT_SECRET, {
    expiresIn: accessTokenExpiresIn,
  });
  const refreshToken = sign({ uid }, JWT_REFRESH_SECRET, {
    expiresIn: refreshTokenExpiresIn,
  });

  return {
    accessToken,
    accessExpiresIn: accessTokenExpiresIn,
    refreshToken,
    refreshExpiresIn: refreshTokenExpiresIn,
  };
};

const verifyToken = async (token: string) => {
  try {
    return verify(token, JWT_SECRET) as { uid: string };
  } catch (error) {
    console.error("Error al verificar access token:", error);
    return null;
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

    return { valid: true, expired, uid: decoded.uid };
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return { valid: false, expired: false, uid: null, error };
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
      // console.log("==========?", userData);
      if (refreshToken !== userData.data?.[0].refreshToken) {
        // userData.data?.[0].auth_users.refreshToken
        return {
          success: false,
          code: 400,
          error: {
            msg: "El Refresh Token es invalido",
          },
        };
      }
      const decodedRefreshToken = verify(refreshToken, JWT_REFRESH_SECRET) as {
        uid: string;
      };
      const newAccessToken = sign({ uid: decoded.uid }, JWT_SECRET, {
        expiresIn: accessTokenExpiresIn,
      });

      const typeEntity = userData.data?.[0].typeEntity;

      if (userData.data?.[0].auth_users) {
        await CompanyModel.updateOne(
          { "auth_users.Uid": userData.data[0].auth_users.Uid }, // Filtrar por Uid dentro del array
          { $set: { "auth_users.$.accessToken": newAccessToken } } // Actualizar accessToken
        );
      } else if (typeEntity === TypeEntity.COMPANY) {
        await CompanyModel.updateOne(
          { uid: decoded.uid }, // Filtrar por uid
          { $set: { accessToken: newAccessToken } } // Actualizar accessToken
        );
      } else {
        await UserModel.updateOne(
          { uid: decoded.uid }, // Filtrar por uid
          { $set: { accessToken: newAccessToken } } // Actualizar accessToken
        );
      }
      return {
        success: true,
        accessToken: newAccessToken,
      };
    } else {
      throw new Error(decoded.error?.message);
    }
  } catch (error) {
    console.error("Error al generar nuevo access token:", error);
    return { success: false, msg: "Error al generar nuevo access token" };
  }
};

const verifyRefreshAccessToken = async (token: string) => {
  try {
    return verify(token, JWT_REFRESH_SECRET) as { uid: string };
  } catch (error) {
    console.error("Error al verificar refresh token:", error);
    return { success: false, msg: "Refresh Token inválido" };
  }
};

const decodeToken = (token: string) => {
  const decoded: any = jwt.decode(token);
  if (decoded && decoded.exp) {
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000); // Segundos restantes
    return expiresIn;
  }
  return null;
};

export {
  generateToken,
  verifyToken,
  generateRefreshAccessToken,
  verifyRefreshAccessToken,
  decodeToken,
};
