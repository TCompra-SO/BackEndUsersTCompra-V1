import {
  BaseNotificationI,
  NotificationI,
} from "../interfaces/notification.interface";
import CompanyModel from "../models/companyModel";
import NotificationModel from "../models/notificationModel";
import UserModel from "../models/userModel";
import {
  NotificationAction,
  NotificationType,
  RequirementType,
} from "../types/globalTypes";
import { categories } from "../utils/Categories";
import {
  broadcastNotificationExpiresIn,
  notificationSystemSenderId,
  notificationSystemSenderName,
} from "../utils/Globals";

export const getNotifications = async (
  entityId: string,
  receiverId: string,
  page: number,
  pageSize: number
) => {
  try {
    let userCategories =
      (await UserModel.findOne(
        { uid: receiverId },
        { categories: 1, _id: 0 }
      )) ??
      (await CompanyModel.findOne(
        { uid: entityId },
        { categories: 1, _id: 0 }
      ));
    const query: any = { $or: [{ receiverId }] }; // Incluir notificaciones directas siempre
    if (userCategories?.categories?.length) {
      // Incluir notificaciones broadcast
      query.$or.push({
        type: NotificationType.BROADCAST,
        categoryId: { $in: userCategories.categories },
      });
    }
    const resultData = await NotificationModel.find(query)
      .sort({ timestamp: -1 })
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

export const getUnreadNotificationsCounter = async (
  entityId: string,
  receiverId: string,
  lastSession?: string
) => {
  try {
    let userCategories =
      (await UserModel.findOne(
        { uid: receiverId },
        { categories: 1, _id: 0 }
      )) ??
      (await CompanyModel.findOne(
        { uid: entityId },
        { categories: 1, _id: 0 }
      ));
    const orConditions: any[] = [{ receiverId }]; // Incluir notificaciones directas
    if (userCategories?.categories?.length) {
      // Incluir notificaciones broadcast
      orConditions.push({
        type: NotificationType.BROADCAST,
        categoryId: { $in: userCategories.categories },
      });
    }
    const query = {
      $and: [
        { $or: orConditions },
        { read: false },
        {
          // Si no hay fecha de ultima sesión, tomar solo 1 dia de antiguedad
          timestamp: {
            $gte: new Date(
              lastSession ? lastSession : Date.now() - 24 * 60 * 60 * 1000
            ),
          },
        },
      ],
    };
    const count = await NotificationModel.countDocuments(query);

    return {
      success: true,
      code: 200,
      data: count,
    };
  } catch (error) {
    console.error("Error en getUnreadNotificationsCount:", error);
    return {
      success: false,
      code: 500,
      error: {
        msg: "Error al contar notificaciones.",
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
        const notification: BaseNotificationI = {
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
          expiresAt: new Date(
            Date.now() + broadcastNotificationExpiresIn * 60 * 1000
          ),
          categoryId: group._id,
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

export const readNotification = async (notificationId: string) => {
  try {
    const resultData = await NotificationModel.updateOne(
      { uid: notificationId, type: NotificationType.DIRECT },
      { read: true }
    );
    return {
      success: true,
      code: 200,
    };
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    return {
      success: false,
      code: 500,
      error: {
        msg: "Error al al marcar notificación como leída.",
      },
    };
  }
};
