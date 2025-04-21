import { Request, Response, NextFunction } from "express";
import NotificationModel from "../models/notificationModel";
import {
  BaseNotificationI,
  NotificationI,
} from "../interfaces/notification.interface";
import {
  NotificationAction,
  NotificationType,
  TypeSocket,
} from "../types/globalTypes";
import { io } from "../server";
import { directNotificationExpiresIn } from "../utils/Globals";

export const saveNotificationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send.bind(res);
  let notificationSaved = false;

  res.send = function (body: any) {
    try {
      if (
        !notificationSaved &&
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        (req.body?.notification || body?.notification)
      ) {
        notificationSaved = true;
        const notification: BaseNotificationI =
          req.body.notification ?? body.notification;

        // Certificación enviada por 1ra vez
        if (
          notification.action == NotificationAction.VIEW_CERTIFICATION &&
          !notification.targetId
        ) {
          notification.targetId = body.res?.uid;
        }
        if (
          notification.receiverId &&
          notification.targetId &&
          notification.type == NotificationType.DIRECT
        ) {
          notification.expiresAt = new Date(
            Date.now() + directNotificationExpiresIn * 24 * 60 * 60 * 1000
          );
          NotificationModel.create(notification)
            .then((res) => {
              io.to(`notification${notification.receiverId}`).emit(
                "updateRoom",
                {
                  dataPack: { data: [res.toObject()] },
                  typeSocket: TypeSocket.CREATE,
                  key: res.uid,
                  userId: res.senderId,
                }
              );
            })
            .catch((error) =>
              console.error("Error al guardar notificación directa:", error)
            );
        }
      }
    } catch (e) {
      console.log("Error al crear notificación", e);
    }

    return originalSend(body);
  };

  next();
};

export const saveNotificationsAndBroadcastMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send.bind(res);
  let notificationSaved = false;

  res.send = function (body: any) {
    try {
      if (
        !notificationSaved &&
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        body?.data
      ) {
        notificationSaved = true;
        const notifications: BaseNotificationI[] = body.data;

        notifications.forEach((notification) => {
          NotificationModel.create(notification)
            .then((res) => {
              io.to(`TCNotifications`).emit("updateRoom", {
                dataPack: { data: [res.toObject()] },
                typeSocket: TypeSocket.CREATE,
                key: res.senderId,
                userId: res.receiverId,
              });
            })
            .catch((error) =>
              console.error("Error al guardar notificación broadcast:", error)
            );
        });
      }
    } catch (e) {
      console.log("Error al crear notificación", e);
    }

    return originalSend(body);
  };

  next();
};
