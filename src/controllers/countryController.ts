import { Request, Response } from "express";
import { getCountries } from "../services/countryServices";

export const listCountries = (req: Request, res: Response) => {
  const { id } = req.params;
  const result = getCountries(id);

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(404).json({ error: result.error });
  }
};
