import { Request, Response } from "express";
import { ReportServices } from "../services/reportServices";

export const getCountsByEntityController = async (
  req: Request,
  res: Response
) => {
  const { uid } = req.params;
  try {
    const responseUser = await ReportServices.getCountsByEntity(uid);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getCountByEntityController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
