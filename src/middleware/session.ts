import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.handle";
import { RequestExt } from "./../interfaces/req-ext";

const checkJwt = async (req: RequestExt, res: Response, next: NextFunction) => {
 
  try {
    const jwtByUser = req.headers.authorization || null;
    if (!jwtByUser) {
      return res.status(401).send({
        success: false,
        code: 401,
        error: {
          msg: "NO_TIENES_UN_JWT_VALIDO",
        },
      });
    }

    const jwt = jwtByUser.split(" ")[1]; // Obtener el token después de "Bearer"
    if (!jwt) {
      return res.status(401).send({
        success: false,
        code: 401,
        error: {
          msg: "NO_TIENES_UN_JWT_VALIDO",
        },
      });
    }

    const isUser = (await verifyToken(jwt)) as { uid: string }; // Decodificar token

    if (!isUser) {
      return res.status(401).send({
        success: false,
        code: 401,
        error: {
          msg: "NO_TIENES_UN_JWT_VALIDO",
        },
      });
    } else {
      req.user = isUser; // Guardamos los datos decodificados
      req.token = jwt; // ✅ Guardamos el token en `req.token`

      next();
    }
  } catch (e) {
    res.status(400).send({
      success: false,
      code: 400,
      error: {
        msg: "NO_TIENES_UN_JWT_VALIDO",
      },
    });
  }
};

export { checkJwt };
