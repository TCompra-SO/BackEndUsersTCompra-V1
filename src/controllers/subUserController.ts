import { Request, Response } from "express";
import { subUserServices } from "../services/subUserServices";

const registerSubUserController = async ({ body }: Request, res: Response) => {
  const { uid, dni, address, cityID, phone, email, typeID } = body;
  try {
    const responseUser = await subUserServices.NewSubUser(
      uid,
      dni,
      address,
      cityID,
      phone,
      email,
      typeID
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else if (responseUser) {
      res.status(responseUser.code).send(responseUser.error);
    } else {
      res.status(500).send({
        success: false,
        msg: "Error interno del servidor, respuesta inválida.",
      });
    }
  } catch (error) {
    console.error("Error en RegisterController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export { registerSubUserController };
