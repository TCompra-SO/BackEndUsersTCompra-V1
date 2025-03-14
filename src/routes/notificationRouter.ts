import { Router } from "express";
import {
  getNotificationsController,
  sendLastRequirementsNotificationController,
  sendNotificationController,
} from "../controllers/notificationController";
import {
  saveNotificationMiddleware,
  saveNotificationsAndBroadcastMiddleware,
} from "../middleware/notification";

export class NotificationRouter {
  private static instance: NotificationRouter;
  private router: Router;

  private constructor() {
    this.router = Router();

    this.router.post(
      "/send",
      saveNotificationMiddleware,
      sendNotificationController
    );
    this.router.get(
      "/getNotifications/:receiverId/:page/:pageSize",
      getNotificationsController
    );
    this.router.post(
      "/sendLastRequirementsNotification/:type",
      saveNotificationsAndBroadcastMiddleware,
      sendLastRequirementsNotificationController
    );
  }

  static getRouter(): Router {
    if (!NotificationRouter.instance) {
      NotificationRouter.instance = new NotificationRouter();
    }
    return NotificationRouter.instance.router;
  }
}
