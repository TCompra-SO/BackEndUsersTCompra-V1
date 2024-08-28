import { Request, Response, response } from "express";
import { handleHttp } from "../utils/error.handle";
import { JwtPayload } from "jsonwebtoken";
import { RequestExt } from "./../interfaces/req-ext";

const getItems = async (req: RequestExt, res: Response) => {
  try {
    res.send({
      data: "ESTO SOLO LO VEN LAS PERSONAS CON SESSION /JWT",
      user: req.user,
    });
  } catch (e) {
    handleHttp(res, "ERROR_GET_ORDERS");
  }
};

export { getItems };
