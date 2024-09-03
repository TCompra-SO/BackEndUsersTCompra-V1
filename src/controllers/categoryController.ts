import { Request, Response } from "express";
import { getCategories } from "../services/categoryServices";

export const listCategories = (req: Request, res: Response) => {
  const result = getCategories();

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
};
