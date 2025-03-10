import { Request, Response, NextFunction } from "express";
import NotificationModel from "../models/notificationModel";
import { NotificationI } from "../interfaces/notification.interface";
import { NotificationAction, TypeSocket } from "../types/globalTypes";
import { io } from "../server";

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
        req.body
      ) {
        notificationSaved = true;
        const notification: NotificationI =
          req.body.notification ?? body.notification;

        // Certificación enviada por 1ra vez
        if (
          notification.action == NotificationAction.VIEW_CERTIFICATION &&
          !notification.targetId
        ) {
          notification.targetId = body.res?.uid;
        }

        if (notification.receiverId && notification.targetId) {
          console.log(notification, body);
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
              console.error("Error saving notification:", error)
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
