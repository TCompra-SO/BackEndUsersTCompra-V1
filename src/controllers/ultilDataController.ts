import { Request, Response } from "express";
import { getLastRecords, getUtilData } from "../services/utilsServices";
import { UtilDataType } from "../types/globalTypes";
import { UtilData } from "../utils/UtilData";

export const getUtilDataController = (req: Request, res: Response) => {
  const { namedata } = req.params;

  const result = getUtilData(namedata as UtilDataType);

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
};

export const getLastRecordsController = async (req: Request, res: Response) => {
  try {
    const { userId, categories } = req.body;

    const responseUser = await getLastRecords(userId, categories);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getLastRecordsController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
