import { Request, Response } from "express";
import NotificationModel from "../models/notificationModel";
import { getNotifications } from "../services/notificationServices";

export const sendNotificationController = async (
  req: Request,
  res: Response
) => {
  // Notificación
  res.status(200).send({ notification: req.body });
};

export const getNotificationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { receiverId, page, pageSize } = req.params;
    const responseNotif = await getNotifications(
      receiverId,
      Number(page),
      Number(pageSize)
    );
    if (responseNotif.success) {
      res.status(responseNotif.code).send(responseNotif);
    } else {
      res.status(responseNotif.code).send(responseNotif.error);
    }
  } catch (error) {
    console.error("Error en getNotificationsController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
