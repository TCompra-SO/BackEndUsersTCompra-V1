import NotificationModel from "../models/notificationModel";

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
