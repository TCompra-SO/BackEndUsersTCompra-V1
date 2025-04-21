import { Request, Response } from "express";
import {
  getNotificationFromLastRequirementsPublished,
  getNotifications,
  getUnreadNotificationsCounter,
  readNotification,
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
    const { entityId, receiverId, page, pageSize } = req.params;
    const responseNotif = await getNotifications(
      entityId,
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

export const getUnreadNotificationsCounterController = async (
  req: Request,
  res: Response
) => {
  try {
    const { entityId, receiverId, lastSession } = req.body;
    const responseNotif = await getUnreadNotificationsCounter(
      entityId,
      receiverId,
      lastSession
    );
    if (responseNotif.success)
      res.status(responseNotif.code).send(responseNotif);
    else res.status(responseNotif.code).send(responseNotif.error);
  } catch (error) {
    console.error("Error en getUnreadNotificationsCounterController", error);
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

export const readNotificationController = async (
  req: Request,
  res: Response
) => {
  try {
    const { notificationId } = req.params;
    const responseNotif = await readNotification(notificationId);
    if (responseNotif.success)
      res.status(responseNotif.code).send(responseNotif);
    else res.status(responseNotif.code).send(responseNotif.error);
  } catch (error) {
    console.error("Error en readNotificationController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
