import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt.handle";
import { RequestExt } from "./../interfaces/req-ext";
import { accessTokenName } from "../utils/cookies.handle";

const checkJwt = async (req: RequestExt, res: Response, next: NextFunction) => {
  try {
    // const jwtByUser = req.headers.authorization || null;
    const jwtByUser = req.cookies || null;
    if (!jwtByUser) {
      return res.status(401).send({
        success: false,
        code: 401,
        error: {
          msg: "NO_TIENES_UN_JWT_VALIDO",
        },
      });
    }

    // const jwt = jwtByUser.split(" ")[1]; // Obtener el token después de "Bearer"
    const jwt = req.cookies[accessTokenName];
    if (!jwt) {
      return res.status(401).send({
        success: false,
        code: 401,
        error: {
          msg: "NO_TIENES_UN_JWT_VALIDO",
        },
      });
    }

    const { valid, expired, decoded } = await verifyToken(jwt);

    if (!valid || !decoded) {
      return res.status(401).send({
        success: false,
        code: 401,
        error: {
          msg: expired ? "TOKEN_EXPIRADO" : "NO_TIENES_UN_JWT_VALIDO",
        },
      });
    }

    req.user = decoded; // ✅ Solo si decoded no es null
    req.token = jwt;
    next();
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
