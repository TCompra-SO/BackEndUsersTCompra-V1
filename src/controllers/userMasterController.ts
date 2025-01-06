import { Request, Response } from "express";
import { UserMasterService } from "../services/userMasterServices";

export const UserMasterController = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  try {
    const responseUser = await UserMasterService.createMasterUser(
      username,
      email,
      password
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en UserMasterController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
