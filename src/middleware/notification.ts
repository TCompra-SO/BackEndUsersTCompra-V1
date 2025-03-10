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
    if (
      !notificationSaved &&
      res.statusCode >= 200 &&
      res.statusCode < 300 &&
      req.body
    ) {
      notificationSaved = true;
      const notification: NotificationI = req.body;

      // Certificación enviada por 1ra vez
      if (
        notification.action == NotificationAction.VIEW_CERTIFICATION &&
        !notification.targetId
      ) {
        notification.targetId = body.res?.uid;
      }

      if (notification.receiverId && notification.targetId)
        NotificationModel.create(notification)
          .then((res) => {
            io.to(`notification${notification.receiverId}`).emit("updateRoom", {
              dataPack: { data: [res.toObject()] },
              typeSocket: TypeSocket.CREATE,
              key: res.uid,
              userId: res.senderId,
            });
          })
          .catch((error) => console.error("Error saving notification:", error));
    }

    return originalSend(body);
  };

  next();
};
