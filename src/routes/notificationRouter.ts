import { Router } from "express";
import {
  getNotificationsController,
  sendNotificationController,
} from "../controllers/notificationController";
import { saveNotificationMiddleware } from "../middleware/notification";

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
  }

  static getRouter(): Router {
    if (!NotificationRouter.instance) {
      NotificationRouter.instance = new NotificationRouter();
    }
    return NotificationRouter.instance.router;
  }
}
