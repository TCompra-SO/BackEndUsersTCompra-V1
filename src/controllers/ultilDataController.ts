import { Request, Response } from "express";
import { getUtilData } from "../services/utilsServices";
import { UtilDataType } from "../types/globalTypes";

export const getUtilDataController = (req: Request, res: Response) => {
  const { namedata } = req.params;

  const result = getUtilData(namedata as UtilDataType);

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
};
