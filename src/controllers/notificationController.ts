import { Request, Response } from "express";
import {
  getNotificationFromLastRequirementsPublished,
  getNotifications,
} from "../services/notificationServices";

export const sendNotificationController = async (
  req: Request,
  res: Response
) => {
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
    if (responseNotif.success)
      res.status(responseNotif.code).send(responseNotif);
    else res.status(responseNotif.code).send(responseNotif.error);
  } catch (error) {
    console.error("Error en getNotificationsController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const sendLastRequirementsNotificationController = async (
  req: Request,
  res: Response
) => {
  try {
    const { type } = req.params;
    const response = getNotificationFromLastRequirementsPublished(
      Number(type),
      req.body
    );
    if (response)
      if (response.success) res.status(response.code).send(response);
      else res.status(response.code).send(response.error);
  } catch (error) {
    console.error("Error en sendLastRequirementsNotificationController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
