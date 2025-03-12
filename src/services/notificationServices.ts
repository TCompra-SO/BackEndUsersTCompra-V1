import { NotificationI } from "../interfaces/notification.interface";
import NotificationModel from "../models/notificationModel";
import {
  NotificationAction,
  NotificationType,
  RequirementType,
} from "../types/globalTypes";
import { categories } from "../utils/Categories";
import {
  notificationSystemSenderId,
  notificationSystemSenderName,
} from "../utils/Globals";

export const getNotifications = async (
  receiverId: string,
  page: number,
  pageSize: number
) => {
  try {
    const resultData = await NotificationModel.find({ receiverId })
      .select("-request")
      .sort({ creationDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    return {
      success: true,
      code: 200,
      data: resultData,
    };
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return {
      success: false,
      code: 500,
      error: {
        msg: "Error al obtener notificaciones.",
      },
    };
  }
};

export const getNotificationFromLastRequirementsPublished = (
  type: RequirementType,
  groups: { _id: number; count: number }[]
) => {
  try {
    if (
      type == RequirementType.GOOD ||
      type == RequirementType.SERVICE ||
      type == RequirementType.SALE
    ) {
      const categoriesMap = categories.reduce((acc, category) => {
        acc[category.id] = category.value;
        return acc;
      }, {} as Record<number, string>);

      const newWord: string =
        type == RequirementType.SALE ? "Nuevas" : "Nuevos";
      const subjectWord: string =
        type == RequirementType.GOOD
          ? "bienes"
          : type == RequirementType.SERVICE
          ? "servicios"
          : "liquidaciones";
      const publishWord: string =
        type == RequirementType.SALE ? "publicadas" : "publicados";

      const notifications = groups.map((group) => {
        const notification: NotificationI = {
          uid: "",
          senderId: notificationSystemSenderId,
          senderName: notificationSystemSenderName,
          timestamp: new Date(),
          title: `${newWord} ${subjectWord}`,
          body: `${
            group.count
          } ${newWord} ${subjectWord} han sido ${publishWord} en tu rubro ${
            categoriesMap[group._id]
          }.`,
          action: NotificationAction.VIEW_CAT_LAST_REQUIREMENTS,
          targetType: type,
          type: NotificationType.BROADCAST,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hora
        };
        return notification;
      });
      return {
        success: true,
        code: 200,
        data: notifications,
      };
    }
  } catch (error) {
    console.error("Error al generar notificaciones de rubros:", error);
    return {
      success: false,
      code: 500,
      error: {
        msg: "Error al generar notificaciones de rubros",
      },
    };
  }
};
