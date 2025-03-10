import { Request, Response } from "express";

export const sendNotificationController = async (
  req: Request,
  res: Response
) => {
  // Notificación
  res.status(200).send({ notification: req.body });
};
