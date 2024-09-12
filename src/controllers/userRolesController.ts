import { Request, Response } from "express";
import { getUserRoles } from "./../services/userRolesService";

export const listUserRoles = (req: Request, res: Response) => {
  const result = getUserRoles();

  if (result.success) {
    res.status(200).json(result.data);
  } else {
    res.status(500).json({ error: result.error });
  }
};
