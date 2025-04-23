import axios from "axios";
import ChatModel from "../models/chatModel";
import MessageModel from "../models/messageModel";
import dotenv from "dotenv";
import { RequirementType, TypeEntity } from "../types/globalTypes";
import { AuthServices } from "./authServices";
import CompanyModel from "../models/companyModel";
import UserModel from "../models/userModel";
import { boolean } from "joi";
import Fuse from "fuse.js";
export class ChatService {
  static createChat = async (
    userId: string,
    requerimentId: string,
    title: string,
    type: RequirementType
  ) => {
    let API_POINT, endpoint;
    dotenv.config();
    switch (type) {
      case RequirementType.GOOD:
        API_POINT = process.env.API_PRODUCTS || "";
        endpoint = "/v1/requeriments/getRequeriment/" + requerimentId;
        break;
      case RequirementType.SERVICE:
        API_POINT = process.env.API_SERVICES || "";
        endpoint = "/v1/requeriments/getRequeriment/" + requerimentId;
        break;
      case RequirementType.SALE:
        API_POINT = process.env.API_LIQUIDATIONS || "";
        endpoint = "/v1/requeriments/getRequeriment/" + requerimentId;
      default:
        break;
    }
    let requerimentData, chatPartnerId;

    try {
      requerimentData = await axios.get(`${API_POINT}${endpoint}`);
      chatPartnerId = requerimentData.data.data[0].userID;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          code: 401,
          error: {
            msg: error.response?.data.msg,
          },
        };
      } else {
        console.error("Error desconocido:", error);
      }
    }
    const result = await ChatModel.findOne({
      userId: userId,
      chatPartnerId: chatPartnerId,
      requerimentId: requerimentId,
    });
    if (result) {
      return {
        success: false,
        code: 400,
        error: {
          msg: "ya tienes una conversación iniciada",
          uid: result.uid,
        },
      };
    }
    try {
      const newChat = new ChatModel({
        userId,
        requerimentId,
        chatPartnerId,
        title,
        lastDate: new Date(), // Fecha en string
      });
      await newChat.save();
      return {
        success: true,
        code: 200,
        message: "Chat creado exitosamente",
        chat: newChat,
      };
    } catch (error) {
      console.error("Error al crear el chat:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al crear el chat",
        },
      };
    }
  };

  static getChat = async (chatId: string) => {
    try {
      const result = await ChatModel.findOne({ uid: chatId });
      //const result = await ChatModel.aggregate([]);
      return {
        success: true,
        code: 200,
        data: result,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener el chat",
        },
      };
    }
  };

  static createMessage = async (
    chatId: string,
    userId: string,

    message: string
  ) => {
    try {
      const chatData: any = await this.getChat(chatId);
      const chatUserId = chatData.data?.userId;
      const chatPartnerId = chatData.data?.chatPartnerId;
      let userData, partnerData;
      if (chatUserId && chatPartnerId) {
        userData = await AuthServices.getDataBaseUser(chatUserId);
        partnerData = await AuthServices.getDataBaseUser(chatPartnerId);
      } else {
        return {
          success: false,
          code: 400,
          error: {
            msg: "Error al obtener los datos de los usuarios",
          },
        };
      }
      if (userData.data?.[0].uid === partnerData.data?.[0].uid) {
        return {
          success: false,
          code: 409,
          error: {
            msg: "No puedes enviar un mensaje a la misma entidad",
          },
        };
      }
      // const partnerData = await AuthServices.getDataBaseUser()

      if (!chatData.data?.uid) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "Chat no encontrado",
          },
        };
      }
      if (
        userId !== chatData.data?.userId &&
        userId !== chatData.data?.chatPartnerId
      ) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "No tienes permisos para crear mensajes en este chat",
          },
        };
      }

      const sendMessage = new MessageModel({
        chatId,
        userId,
        message,
        timestamp: new Date(),
        read: false,
      });

      let receiverUser, fieldRead;
      if (userId === chatData.data?.userId) {
        receiverUser = chatData.data?.chatPartnerId;
        fieldRead = "unReadPartner";
      } else {
        receiverUser = chatData.data?.userId;
        fieldRead = "unReadUser";
      }
      await sendMessage.save();

      await ChatModel.updateOne(
        { uid: chatId }, // Filtro por chatId
        {
          $set: { lastDate: new Date(), lastMessage: message },
          $inc: { numUnreadMessages: 1, [fieldRead]: 1 },
        } // Actualiza lastDate con la fecha actual
      );

      return {
        success: true,
        code: 200,
        data: sendMessage,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener el Message",
        },
      };
    }
  };

  static getMessagesBefore = async (
    chatId: string,
    beforeMessageId: string,
    pageSize: number
  ) => {
    try {
      let timestampCursor: Date | null = null;

      if (beforeMessageId) {
        const referenceMessage = await MessageModel.findOne({
          chatId,
          uid: beforeMessageId,
        }).lean();

        if (!referenceMessage) {
          return {
            success: false,
            code: 404,
            error: { msg: "Error al obtener el mensaje de referencia" },
          };
        }

        timestampCursor = referenceMessage.timestamp;
      }

      const query: any = { chatId };
      if (timestampCursor) {
        query.timestamp = { $lt: timestampCursor };
      }

      const messages = await MessageModel.find(query)
        .sort({ timestamp: -1 })
        .limit(pageSize)
        .lean();
      const totalMessages = await MessageModel.countDocuments({
        chatId: chatId,
      });
      return {
        success: true,
        code: 200,
        data: messages,
        res: {
          totalDocuments: totalMessages,
          totalPages: Math.ceil(totalMessages / pageSize),
          pageSize: pageSize,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener mensajes",
        },
      };
    }
  };

  static getMessages = async (
    chatId: string,
    page: number,
    pageSize: number
  ) => {
    try {
      const skip = (page - 1) * pageSize;
      const messages = await MessageModel.find({
        chatId: chatId,
      })
        .sort({ timestamp: -1 }) // Orden descendente (últimos mensajes primero)
        .skip(skip) // Saltar los mensajes según la página
        .limit(pageSize) // Limitar la cantidad de mensajes por página
        .lean(); // Optimiza la consulta para solo devolver JSON

      const totalMessages = await MessageModel.countDocuments({
        chatId: chatId,
      });
      return {
        success: true,
        code: 200,
        data: messages,
        res: {
          totalDocuments: totalMessages,
          totalPages: Math.ceil(totalMessages / pageSize),
          currentPage: page,
          pageSize: pageSize,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener el Message",
        },
      };
    }
  };
  static getMessage = async (messageId: string) => {
    try {
      const resultData = await MessageModel.findOne({ uid: messageId });
      return {
        success: true,
        code: 200,
        data: resultData,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener el Message",
        },
      };
    }
  };

  static readMessages = async (
    messageIds: string[],
    chatId: string,
    userId?: string
  ) => {
    try {
      // Actualizar los mensajes cuyo _id esté en el array
      let count = 0;
      let messages: any = [];
      if (messageIds.length <= 0) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No hay mensajes para leer",
          },
        };
      }
      if (messageIds.length === 1) {
        const message = await MessageModel.findOne({ uid: messageIds[0] });

        if (!message) {
          return {
            success: false,
            code: 404,
            error: {
              msg: "Mensaje no encontrado",
            },
          };
        }

        // 1. Buscar los mensajes que se van a modificar
        const messagesToUpdate = await MessageModel.find({
          chatId: chatId,
          userId: userId,
          read: false,
          timestamp: { $lte: message.timestamp },
        });

        if (messagesToUpdate.length <= 0) {
          return {
            success: false,
            code: 400,
            error: {
              msg: "No hay mensajes para leer",
            },
          };
        }
        // 2. Actualizarlos
        await MessageModel.updateMany(
          { uid: { $in: messagesToUpdate.map((msg) => msg.uid) } },
          { $set: { read: true } }
        ).sort({ timestamp: -1 }); // Más reciente a más antiguo

        // 2. Obtener el _id del mensaje más antiguo (último en el array)
        const endMessageId = messagesToUpdate?.[0].uid;

        // 3. Devolver los mensajes modificados

        //PENDIENTE LOS MENSAJES ARCHIVADOS
        const chatData: any = await this.getChat(chatId);
        const chatUserId = chatData.data?.userId;
        const chatPartnerId = chatData.data?.chatPartnerId;
        let receiverUser, fieldRead;
        if (userId === chatData.data?.userId) {
          receiverUser = chatData.data?.chatPartnerId;
          fieldRead = "unReadPartner";
        } else {
          receiverUser = chatData.data?.userId;
          fieldRead = "unReadUser";
        }

        await ChatModel.updateOne(
          { uid: chatId },
          {
            $inc: {
              numUnreadMessages: -messagesToUpdate.length,
              [fieldRead]: -messagesToUpdate.length,
            },
          }
        );

        return {
          success: true,
          code: 200,
          data: messagesToUpdate,
          res: {
            endMessageId: endMessageId,
            msg: "mensajes marcados como leidos",
          },
        };
      }
      while (count < messageIds.length) {
        const messageData = await this.getMessage(messageIds[count]);
        const read = messageData.data?.read;
        if (messageData.data?.chatId !== chatId) {
          return {
            success: false,
            code: 400,
            error: {
              msg: "chatId no valido",
            },
          };
        }
        if (!read) {
          const updateResult = await MessageModel.updateOne(
            { uid: messageData.data?.uid },
            { $set: { read: true } }
          );
          if (updateResult.modifiedCount > 0) {
            messages.push({ messageId: messageIds[count], read: true });
          }

          await ChatModel.updateOne(
            { uid: chatId },
            {
              $inc: {
                numUnreadMessages: -1,
              },
            }
          );
        }
        count++;
      }

      return {
        success: true,
        code: 200,
        data: messages,
        res: {
          msg: "Mensajes leídos con éxito",
        },
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al leer los Mensajes",
        },
      };
    }
  };

  static getChatUsersDataBefore = async (
    userId: string,
    lastChatId: string,
    pageSize: number
  ) => {
    try {
      const dataUser = await AuthServices.getDataBaseUser(userId);
      let typeUser;

      if (dataUser.data?.[0].auth_users) {
        typeUser = TypeEntity.SUBUSER;
      } else {
        typeUser = dataUser.data?.[0].typeEntity;
      }

      const matchConditions: any[] = [
        { $or: [{ userId }, { chatPartnerId: userId }] },
        {
          $or: [
            {
              archive: {
                $not: {
                  $elemMatch: {
                    userId: userId,
                    state: true,
                  },
                },
              },
            },
            { archive: { $exists: false } },
          ],
        },
      ];

      if (lastChatId) {
        const lastChat = await ChatModel.findOne(
          { uid: lastChatId },
          { lastDate: 1 }
        );
        if (!lastChat)
          return {
            success: false,
            code: 404,
            error: { msg: "Error al obtener el chat de referencia" },
          };
        matchConditions.push({ lastDate: { $lt: lastChat.lastDate } });
      }

      const chatUsersData = await ChatModel.aggregate([
        {
          $match: {
            $and: matchConditions,
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "userId",
            foreignField: "uid",
            as: "userCompany",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerCompany",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "uid",
            as: "userInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "userId",
            foreignField: "uid",
            as: "subUserUserInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "subUserPartnerInfo",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserUserInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyUser",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserPartnerInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyPartner",
          },
        },
        {
          $addFields: {
            user: {
              $ifNull: [
                { $arrayElemAt: ["$subUserUserInfo.name", 0] },
                { $arrayElemAt: ["$userInfo.name", 0] },
                { $arrayElemAt: ["$userCompany.name", 0] },
                "",
              ],
            },
            partner: {
              $ifNull: [
                { $arrayElemAt: ["$subUserPartnerInfo.name", 0] },
                { $arrayElemAt: ["$partnerInfo.name", 0] },
                { $arrayElemAt: ["$partnerCompany.name", 0] },
                "",
              ],
            },
            userAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserUserInfo" }, 0] },
                then: { $arrayElemAt: ["$subUserCompanyUser.avatar", 0] },
                else: {
                  $ifNull: [
                    { $arrayElemAt: ["$userInfo.avatar", 0] },
                    { $arrayElemAt: ["$userCompany.avatar", 0] },
                    "",
                  ],
                },
              },
            },
            partnerAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserPartnerInfo" }, 0] },
                then: { $arrayElemAt: ["$subUserCompanyPartner.avatar", 0] },
                else: {
                  $ifNull: [
                    { $arrayElemAt: ["$partnerInfo.avatar", 0] },
                    { $arrayElemAt: ["$partnerCompany.avatar", 0] },
                    "",
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            userName: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partner",
                else: "$user",
              },
            },
            userImage: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partnerAvatar",
                else: "$userAvatar",
              },
            },
          },
        },
        {
          $project: {
            userCompany: 0,
            partnerCompany: 0,
            userInfo: 0,
            partnerInfo: 0,
            subUserUserInfo: 0,
            subUserPartnerInfo: 0,
            subUserCompanyUser: 0,
            subUserCompanyPartner: 0,
            user: 0,
            partner: 0,
            userAvatar: 0,
            partnerAvatar: 0,
            archive: 0,
          },
        },
      ])
        .sort({ lastDate: -1 })
        .limit(pageSize);

      const totalDocuments = await ChatModel.countDocuments({
        $and: [
          { $or: [{ userId }, { chatPartnerId: userId }] },
          {
            $or: [
              {
                archive: {
                  $not: {
                    $elemMatch: {
                      userId: userId,
                      state: true,
                    },
                  },
                },
              },
              { archive: { $exists: false } },
            ],
          },
        ],
      });

      return {
        success: true,
        code: 200,
        data: chatUsersData,
        res: {
          totalDocuments: totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          pageSize: pageSize,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener el getChatUserData",
        },
      };
    }
  };

  static getChatUsersData = async (
    userId: string,
    page?: number,
    pageSize?: number
  ) => {
    try {
      //CONTINUAR
      if (!page || page === 0) page = 1;
      if (!pageSize || pageSize === 0) pageSize = 10;

      const skip = (page - 1) * pageSize;

      const dataUser = await AuthServices.getDataBaseUser(userId);
      let typeUser;

      if (dataUser.data?.[0].auth_users) {
        typeUser = TypeEntity.SUBUSER;
      } else {
        typeUser = dataUser.data?.[0].typeEntity;
      }

      const chatUsersData = await ChatModel.aggregate([
        {
          $match: {
            $and: [
              { $or: [{ userId: userId }, { chatPartnerId: userId }] },
              {
                $or: [
                  {
                    archive: {
                      $not: {
                        $elemMatch: {
                          userId: userId,
                          state: true, // si hay state true => excluimos
                        },
                      },
                    },
                  },
                  {
                    archive: { $exists: false }, // sin campo archive
                  },
                ],
              },
            ],
          },
        },
        // 🔍 Lookups
        {
          $lookup: {
            from: "companys",
            localField: "userId",
            foreignField: "uid",
            as: "userCompany",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerCompany",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "uid",
            as: "userInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "userId",
            foreignField: "uid",
            as: "subUserUserInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "subUserPartnerInfo",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserUserInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyUser",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserPartnerInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyPartner",
          },
        },
        // 🛠️ Extraer el nombre y avatar correctamente
        {
          $addFields: {
            user: {
              $ifNull: [
                { $arrayElemAt: ["$subUserUserInfo.name", 0] }, // ✅ Primero intenta con "profiles"
                { $arrayElemAt: ["$userInfo.name", 0] }, // ✅ Luego "users"
                { $arrayElemAt: ["$userCompany.name", 0] }, // 🔽 Finalmente, "companys"
                "",
              ],
            },
            partner: {
              $ifNull: [
                { $arrayElemAt: ["$subUserPartnerInfo.name", 0] }, // ✅ Primero "profiles"
                { $arrayElemAt: ["$partnerInfo.name", 0] }, // ✅ Luego "users"
                { $arrayElemAt: ["$partnerCompany.name", 0] }, // 🔽 Finalmente "companys"
                "",
              ],
            },
            userAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserUserInfo" }, 0] },
                then: { $arrayElemAt: ["$subUserCompanyUser.avatar", 0] },
                else: {
                  $ifNull: [
                    { $arrayElemAt: ["$userInfo.avatar", 0] },
                    { $arrayElemAt: ["$userCompany.avatar", 0] },
                    "",
                  ],
                },
              },
            },
            partnerAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserPartnerInfo" }, 0] },
                then: { $arrayElemAt: ["$subUserCompanyPartner.avatar", 0] },
                else: {
                  $ifNull: [
                    { $arrayElemAt: ["$partnerInfo.avatar", 0] },
                    { $arrayElemAt: ["$partnerCompany.avatar", 0] },
                    "",
                  ],
                },
              },
            },
          },
        },
        // 🔀 Unir userName y partnerName en un solo campo displayName
        {
          $addFields: {
            userName: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partner",
                else: "$user",
              },
            },
            userImage: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partnerAvatar",
                else: "$userAvatar",
              },
            },
          },
        },
        // 🔍 Limpiar los arrays innecesarios
        {
          $project: {
            userCompany: 0,
            partnerCompany: 0,
            userInfo: 0,
            partnerInfo: 0,
            subUserUserInfo: 0,
            subUserPartnerInfo: 0,
            subUserCompanyUser: 0,
            subUserCompanyPartner: 0,
            user: 0,
            partner: 0,
            userAvatar: 0,
            partnerAvatar: 0,
            archive: 0,
          },
        },
      ])
        .sort({ lastDate: -1 }) // Orden descendente (últimos mensajes primero)
        .skip(skip) // Saltar los mensajes según la página
        .limit(pageSize); // Limitar la cantidad de mensajes por página
      // .lean(); // Optimiza la consulta para solo devolver JSON;
      // Obtener el total de documentos antes de paginar
      const totalDocuments = await ChatModel.countDocuments({
        $and: [
          { $or: [{ userId }, { chatPartnerId: userId }] },
          {
            $or: [
              {
                archive: {
                  $not: {
                    $elemMatch: {
                      userId: userId,
                      state: true,
                    },
                  },
                },
              },
              { archive: { $exists: false } },
            ],
          },
        ],
      });
      return {
        success: true,
        code: 200,
        data: chatUsersData,
        res: {
          totalDocuments: totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize: pageSize,
        },
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener el getChatUserData",
        },
      };
    }
  };

  static changeStateConnection = async (userId: string, online: boolean) => {
    try {
      const userData = await AuthServices.getDataBaseUser(userId);
      let typeEntity;

      if (!userData.success) {
        return {
          success: false,
          code: 407,
          error: {
            msg: "Error al obtener el usuario",
          },
        };
      }
      if (userData.data?.[0].auth_users) {
        typeEntity = TypeEntity.SUBUSER;
      } else {
        typeEntity = userData.data?.[0].typeEntity;
      }
      let updateResult;
      switch (typeEntity) {
        case TypeEntity.SUBUSER:
          updateResult = await CompanyModel.updateOne(
            { "auth_users.Uid": userId }, // Encuentra la empresa que tiene un subusuario con el Uid dado
            { $set: { "auth_users.$[elem].online": online } }, // Establece el campo auth_users.online en true
            { arrayFilters: [{ "elem.Uid": userId }] }
          );
          break;
        case TypeEntity.COMPANY:
          updateResult = await CompanyModel.updateOne(
            { uid: userId }, // Match con uid
            { $set: { online: online } }
          );
          break;
        case TypeEntity.USER:
          updateResult = await UserModel.updateOne(
            { uid: userId }, // Match en UserModel con uid
            { $set: { online: online } }
          );
          break;
        default:
          return {
            success: false,
            code: 400,
            error: {
              msg: "Error al obtener el suario",
            },
          };
          break;
      }

      // Verificar si la actualización fue exitosa
      if (updateResult.modifiedCount > 0) {
        return {
          success: true,
          code: 200,
          state: online,
          res: {
            msg: "Estado de conexión actualizado con éxito",
          },
        };
      } else {
        return {
          success: false,
          code: 401,
          error: {
            msg: "Error al actualizar el estado de conexión",
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al cambiar el estado",
        },
      };
    }
  };

  static getChatInfo = async (
    userId: string,
    userChat: string,
    requerimentId: string
  ) => {
    try {
      const chatData = await ChatModel.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  { $and: [{ userId: userId }, { chatPartnerId: userChat }] }, // Caso 1
                  { $and: [{ userId: userChat }, { chatPartnerId: userId }] }, // Caso 2
                ],
              },
              { requerimentId: requerimentId }, // Filtrar por requerimentId
            ],
          },
        },

        // 🔍 Lookups
        {
          $lookup: {
            from: "companys",
            localField: "userId",
            foreignField: "uid",
            as: "userCompany",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerCompany",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "uid",
            as: "userInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "userId",
            foreignField: "uid",
            as: "subUserUserInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "subUserPartnerInfo",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserUserInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyUser",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserPartnerInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyPartner",
          },
        },

        // 🛠️ Extraer el nombre y avatar correctamente
        {
          $addFields: {
            user: {
              $ifNull: [
                { $first: "$subUserUserInfo.name" },
                { $first: "$userInfo.name" },
                { $first: "$userCompany.name" },
                "",
              ],
            },
            partner: {
              $ifNull: [
                { $first: "$subUserPartnerInfo.name" },
                { $first: "$partnerInfo.name" },
                { $first: "$partnerCompany.name" },
                "",
              ],
            },
            userAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserUserInfo" }, 0] },
                then: { $first: "$subUserCompanyUser.avatar" },
                else: {
                  $ifNull: [
                    { $first: "$userInfo.avatar" },
                    { $first: "$userCompany.avatar" },
                    "",
                  ],
                },
              },
            },
            partnerAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserPartnerInfo" }, 0] },
                then: { $first: "$subUserCompanyPartner.avatar" },
                else: {
                  $ifNull: [
                    { $first: "$partnerInfo.avatar" },
                    { $first: "$partnerCompany.avatar" },
                    "",
                  ],
                },
              },
            },
          },
        },

        // 🔀 Determinar userName y userImage basado en userChat
        {
          $addFields: {
            userName: {
              $cond: {
                if: { $eq: ["$userId", userChat] },
                then: "$user",
                else: "$partner",
              },
            },
            userImage: {
              $cond: {
                if: { $eq: ["$userId", userChat] },
                then: "$userAvatar",
                else: "$partnerAvatar",
              },
            },
          },
        },

        // 🔍 Limpiar los arrays innecesarios
        {
          $project: {
            userCompany: 0,
            partnerCompany: 0,
            userInfo: 0,
            partnerInfo: 0,
            subUserUserInfo: 0,
            subUserPartnerInfo: 0,
            subUserCompanyUser: 0,
            subUserCompanyPartner: 0,
            user: 0,
            partner: 0,
            userAvatar: 0,
            partnerAvatar: 0,
          },
        },
      ]);
      return {
        success: true,
        code: 200,
        data: chatData,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener el chat",
        },
      };
    }
  };

  static searchChat = async (userId: string, keyWords: string) => {
    try {
      const searchRegex = new RegExp(keyWords, "i");

      // 🔍 1️⃣ Buscar coincidencias exactas en MongoDB
      let chats = await ChatModel.aggregate([
        {
          $match: {
            $or: [{ userId: userId }, { chatPartnerId: userId }],
          },
        },

        // Lookups base
        {
          $lookup: {
            from: "companys",
            localField: "userId",
            foreignField: "uid",
            as: "userCompany",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerCompany",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "uid",
            as: "userInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "userId",
            foreignField: "uid",
            as: "subUserUserInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "subUserPartnerInfo",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserUserInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyUser",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserPartnerInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyPartner",
          },
        },

        // Agregamos campos necesarios
        {
          $addFields: {
            user: {
              $ifNull: [
                { $first: "$subUserUserInfo.name" },
                { $first: "$userInfo.name" },
                { $first: "$userCompany.name" },
                "",
              ],
            },
            partner: {
              $ifNull: [
                { $first: "$subUserPartnerInfo.name" },
                { $first: "$partnerInfo.name" },
                { $first: "$partnerCompany.name" },
                "",
              ],
            },
            userAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserUserInfo" }, 0] },
                then: { $first: "$subUserCompanyUser.avatar" },
                else: {
                  $ifNull: [
                    { $first: "$userInfo.avatar" },
                    { $first: "$userCompany.avatar" },
                    "",
                  ],
                },
              },
            },
            partnerAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserPartnerInfo" }, 0] },
                then: { $first: "$subUserCompanyPartner.avatar" },
                else: {
                  $ifNull: [
                    { $first: "$partnerInfo.avatar" },
                    { $first: "$partnerCompany.avatar" },
                    "",
                  ],
                },
              },
            },
          },
        },

        // Determinar userName y userImage para quien consulta (userId)
        {
          $addFields: {
            userName: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partner",
                else: "$user",
              },
            },
            userImage: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partnerAvatar",
                else: "$userAvatar",
              },
            },
          },
        },

        // Búsqueda por texto
        {
          $match: {
            $or: [{ title: searchRegex }, { userName: searchRegex }],
          },
        },

        // Limpiar campos innecesarios
        {
          $project: {
            userCompany: 0,
            partnerCompany: 0,
            userInfo: 0,
            partnerInfo: 0,
            subUserUserInfo: 0,
            subUserPartnerInfo: 0,
            subUserCompanyUser: 0,
            subUserCompanyPartner: 0,
            user: 0,
            partner: 0,
            userAvatar: 0,
            partnerAvatar: 0,
          },
        },

        { $sort: { createdAt: -1 } },
        { $limit: 10 },
      ]);

      // 🚀 2️⃣ Si no hay resultados exactos, hacer búsqueda difusa con Fuse.js
      if (chats.length === 0) {
        const recentChats = await ChatModel.aggregate([
          { $match: { $or: [{ userId: userId }, { chatPartnerId: userId }] } },

          // 🔍 Lookups
          {
            $lookup: {
              from: "companys",
              localField: "userId",
              foreignField: "uid",
              as: "userCompany",
            },
          },
          {
            $lookup: {
              from: "companys",
              localField: "chatPartnerId",
              foreignField: "uid",
              as: "partnerCompany",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "uid",
              as: "userInfo",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "chatPartnerId",
              foreignField: "uid",
              as: "partnerInfo",
            },
          },
          {
            $lookup: {
              from: "profiles",
              localField: "userId",
              foreignField: "uid",
              as: "subUserUserInfo",
            },
          },
          {
            $lookup: {
              from: "profiles",
              localField: "chatPartnerId",
              foreignField: "uid",
              as: "subUserPartnerInfo",
            },
          },
          {
            $lookup: {
              from: "companys",
              localField: "subUserUserInfo.companyID",
              foreignField: "uid",
              as: "subUserCompanyUser",
            },
          },
          {
            $lookup: {
              from: "companys",
              localField: "subUserPartnerInfo.companyID",
              foreignField: "uid",
              as: "subUserCompanyPartner",
            },
          },

          // 🛠️ Extraer el nombre y avatar correctamente
          {
            $addFields: {
              user: {
                $ifNull: [
                  { $first: "$subUserUserInfo.name" },
                  { $first: "$userInfo.name" },
                  { $first: "$userCompany.name" },
                  "",
                ],
              },
              partner: {
                $ifNull: [
                  { $first: "$subUserPartnerInfo.name" },
                  { $first: "$partnerInfo.name" },
                  { $first: "$partnerCompany.name" },
                  "",
                ],
              },
              userAvatar: {
                $cond: {
                  if: { $gt: [{ $size: "$subUserUserInfo" }, 0] },
                  then: { $first: "$subUserCompanyUser.avatar" },
                  else: {
                    $ifNull: [
                      { $first: "$userInfo.avatar" },
                      { $first: "$userCompany.avatar" },
                      "",
                    ],
                  },
                },
              },
              partnerAvatar: {
                $cond: {
                  if: { $gt: [{ $size: "$subUserPartnerInfo" }, 0] },
                  then: { $first: "$subUserCompanyPartner.avatar" },
                  else: {
                    $ifNull: [
                      { $first: "$partnerInfo.avatar" },
                      { $first: "$partnerCompany.avatar" },
                      "",
                    ],
                  },
                },
              },
            },
          },

          // 🔀 Determinar userName y userImage respecto al usuario que consulta
          {
            $addFields: {
              userName: {
                $cond: {
                  if: { $eq: ["$userId", userId] },
                  then: "$partner",
                  else: "$user",
                },
              },
              userImage: {
                $cond: {
                  if: { $eq: ["$userId", userId] },
                  then: "$partnerAvatar",
                  else: "$userAvatar",
                },
              },
            },
          },

          // 🧹 Limpiar campos innecesarios
          {
            $project: {
              userCompany: 0,
              partnerCompany: 0,
              userInfo: 0,
              partnerInfo: 0,
              subUserUserInfo: 0,
              subUserPartnerInfo: 0,
              subUserCompanyUser: 0,
              subUserCompanyPartner: 0,
              user: 0,
              partner: 0,
              userAvatar: 0,
              partnerAvatar: 0,
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 100 },
        ]);

        if (recentChats.length > 0) {
          const fuse = new Fuse(recentChats, {
            keys: ["title", "userName"],
            threshold: 0.4,
          });
          chats = fuse
            .search(keyWords)
            .slice(0, 10)
            .map((result) => result.item);
        }
      }

      return {
        success: true,
        code: 200,
        data: chats,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener el chats",
        },
      };
    }
  };

  static archiveChat = async (
    chatId: string,
    userId: string,
    archive: boolean
  ) => {
    try {
      const chat = await ChatModel.findOne({ uid: chatId });

      if (!chat) {
        return {
          success: false,
          code: 404,
          error: { msg: "Chat no encontrado" },
        };
      }

      // Intentar actualizar si el userId ya está en archive
      const updated = await ChatModel.findOneAndUpdate(
        {
          uid: chatId,
          "archive.userId": userId, // FIX aquí
        },
        {
          $set: {
            "archive.$.state": archive,
          },
        },
        { new: true }
      );

      // Si no existía, hacemos un push
      let updatedChat = updated;
      if (!updated) {
        updatedChat = await ChatModel.findOneAndUpdate(
          { uid: chatId },
          {
            $push: {
              archive: { userId, state: archive },
            },
          },
          { new: true }
        );
      }

      if (!updatedChat) {
        return {
          success: false,
          code: 404,
          error: { msg: "Chat no encontrado" },
        };
      }
      let msg;
      if (archive) {
        msg = "Chat archivado con éxito";
      } else {
        msg = "Chat desarchivado con éxito";
      }
      return {
        success: true,
        code: 200,
        data: updatedChat,
        res: {
          msg: msg,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al archivar el chat",
        },
      };
    }
  };

  static getArchivedChatsBefore = async (
    userId: string,
    chatId: string,
    pageSize: number
  ) => {
    try {
      if (pageSize < 1) pageSize = 10;

      let createdAtCursor: Date | null = null;
      if (chatId) {
        const referenceChat = await ChatModel.findOne(
          { uid: chatId },
          { lastDate: 1 }
        );
        if (!referenceChat) {
          return {
            success: false,
            code: 404,
            error: { msg: "Chat de referencia no encontrado" },
          };
        }
        createdAtCursor = referenceChat.lastDate;
      }

      const baseMatch: any = {
        $and: [
          {
            $or: [{ userId: userId }, { chatPartnerId: userId }],
          },
          {
            archive: {
              $elemMatch: { userId: userId, state: true },
            },
          },
        ],
      };

      if (createdAtCursor) {
        baseMatch.$and.push({ lastDate: { $lt: createdAtCursor } });
      }

      const chats = await ChatModel.aggregate([
        { $match: baseMatch },

        // 🔄 Lookups
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "uid",
            as: "userInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "userId",
            foreignField: "uid",
            as: "subUserUserInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "subUserPartnerInfo",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "userId",
            foreignField: "uid",
            as: "userCompany",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerCompany",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserUserInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyUser",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserPartnerInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyPartner",
          },
        },

        // 🔧 Calcular nombre y avatar
        {
          $addFields: {
            user: {
              $ifNull: [
                { $first: "$subUserUserInfo.name" },
                { $first: "$userInfo.name" },
                { $first: "$userCompany.name" },
                "",
              ],
            },
            partner: {
              $ifNull: [
                { $first: "$subUserPartnerInfo.name" },
                { $first: "$partnerInfo.name" },
                { $first: "$partnerCompany.name" },
                "",
              ],
            },
            userAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserUserInfo" }, 0] },
                then: { $first: "$subUserCompanyUser.avatar" },
                else: {
                  $ifNull: [
                    { $first: "$userInfo.avatar" },
                    { $first: "$userCompany.avatar" },
                    "",
                  ],
                },
              },
            },
            partnerAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserPartnerInfo" }, 0] },
                then: { $first: "$subUserCompanyPartner.avatar" },
                else: {
                  $ifNull: [
                    { $first: "$partnerInfo.avatar" },
                    { $first: "$partnerCompany.avatar" },
                    "",
                  ],
                },
              },
            },
          },
        },

        // 👥 Mostrar info del otro participante
        {
          $addFields: {
            userName: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partner",
                else: "$user",
              },
            },
            userImage: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partnerAvatar",
                else: "$userAvatar",
              },
            },
          },
        },

        // 🧹 Eliminar campos innecesarios
        {
          $project: {
            userCompany: 0,
            partnerCompany: 0,
            userInfo: 0,
            partnerInfo: 0,
            subUserUserInfo: 0,
            subUserPartnerInfo: 0,
            subUserCompanyUser: 0,
            subUserCompanyPartner: 0,
            user: 0,
            partner: 0,
            userAvatar: 0,
            partnerAvatar: 0,
          },
        },

        // 🔽 Orden y paginación
        { $sort: { lastDate: -1 } },
        { $limit: pageSize },
      ]);

      // 📊 Total de documentos (para paginación)
      const total = await ChatModel.countDocuments({
        $or: [{ userId: userId }, { chatPartnerId: userId }],
        archive: {
          $elemMatch: { userId: userId, state: true },
        },
      });

      return {
        success: true,
        code: 200,
        data: chats,
        res: {
          totalDocuments: total,
          totalPages: Math.ceil(total / pageSize),
          pageSize: pageSize,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener los chats",
        },
      };
    }
  };

  static getArchivedChats = async (
    userId: string,
    page: number,
    pageSize: number
  ) => {
    try {
      if (page < 1) page = 1;
      if (pageSize < 1) pageSize = 10;

      const skip = (page - 1) * pageSize;

      // Obtener total para la paginación
      const total = await ChatModel.countDocuments({
        $or: [{ userId: userId }, { chatPartnerId: userId }],
        archive: {
          $elemMatch: {
            userId: userId,
            state: true,
          },
        },
      });

      // FALTA TRAER USERNAME Y USERIMAGE
      const chats = await ChatModel.aggregate([
        // 🔍 Filtrar los chats donde participa el usuario y están archivados por él
        {
          $match: {
            $and: [
              {
                $or: [{ userId: userId }, { chatPartnerId: userId }],
              },
              {
                archive: {
                  $elemMatch: {
                    userId: userId,
                    state: true,
                  },
                },
              },
            ],
          },
        },

        // 🔄 Lookups para datos de usuario
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "uid",
            as: "userInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "userId",
            foreignField: "uid",
            as: "subUserUserInfo",
          },
        },
        {
          $lookup: {
            from: "profiles",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "subUserPartnerInfo",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "userId",
            foreignField: "uid",
            as: "userCompany",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "chatPartnerId",
            foreignField: "uid",
            as: "partnerCompany",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserUserInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyUser",
          },
        },
        {
          $lookup: {
            from: "companys",
            localField: "subUserPartnerInfo.companyID",
            foreignField: "uid",
            as: "subUserCompanyPartner",
          },
        },

        // 🛠️ Campos de nombre y avatar
        {
          $addFields: {
            user: {
              $ifNull: [
                { $first: "$subUserUserInfo.name" },
                { $first: "$userInfo.name" },
                { $first: "$userCompany.name" },
                "",
              ],
            },
            partner: {
              $ifNull: [
                { $first: "$subUserPartnerInfo.name" },
                { $first: "$partnerInfo.name" },
                { $first: "$partnerCompany.name" },
                "",
              ],
            },
            userAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserUserInfo" }, 0] },
                then: { $first: "$subUserCompanyUser.avatar" },
                else: {
                  $ifNull: [
                    { $first: "$userInfo.avatar" },
                    { $first: "$userCompany.avatar" },
                    "",
                  ],
                },
              },
            },
            partnerAvatar: {
              $cond: {
                if: { $gt: [{ $size: "$subUserPartnerInfo" }, 0] },
                then: { $first: "$subUserCompanyPartner.avatar" },
                else: {
                  $ifNull: [
                    { $first: "$partnerInfo.avatar" },
                    { $first: "$partnerCompany.avatar" },
                    "",
                  ],
                },
              },
            },
          },
        },

        // 🧠 Mostrar nombre y avatar del otro participante
        {
          $addFields: {
            userName: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partner",
                else: "$user",
              },
            },
            userImage: {
              $cond: {
                if: { $eq: ["$userId", userId] },
                then: "$partnerAvatar",
                else: "$userAvatar",
              },
            },
          },
        },

        // 🧹 Limpiar campos no necesarios
        {
          $project: {
            userCompany: 0,
            partnerCompany: 0,
            userInfo: 0,
            partnerInfo: 0,
            subUserUserInfo: 0,
            subUserPartnerInfo: 0,
            subUserCompanyUser: 0,
            subUserCompanyPartner: 0,
            user: 0,
            partner: 0,
            userAvatar: 0,
            partnerAvatar: 0,
          },
        },
      ])
        .skip(skip)
        .limit(pageSize)
        .sort({ lastDate: -1 }); // opcional, orden por última actualización

      for (const chat of chats) {
        if (Array.isArray(chat.archive)) {
          chat.archive = chat.archive.filter((a: any) => a.userId === userId);
        } else {
          chat.archive = []; // Por si acaso, lo dejamos limpio
        }
      }

      return {
        success: true,
        code: 200,
        data: chats,
        res: {
          totalDocuments: total,
          totalPages: Math.ceil(total / pageSize),
          currentPage: page,
          pageSize: pageSize,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al obtener los chats",
        },
      };
    }
  };

  static getCountMessageUnRead = async (userId: string) => {
    try {
      const result = await ChatModel.aggregate([
        {
          $match: {
            $or: [{ userId }, { chatPartnerId: userId }],
            // Excluye si el usuario tiene archive.state == true
            archive: {
              $not: {
                $elemMatch: {
                  userId: userId,
                  state: true,
                },
              },
            },
          },
        },
        {
          $addFields: {
            myUnread: {
              $cond: [
                { $eq: ["$userId", userId] },
                "$unReadUser",
                "$unReadPartner",
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalUnread: { $sum: "$myUnread" },
          },
        },
      ]);
      return {
        success: true,
        code: 200,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al archivar el chat",
        },
      };
    }
  };

  static getCountUnReadByUser = async (userId: string, chatId: string) => {
    try {
      const unreadCount = await ChatModel.countDocuments({
        chatId: chatId,
        userId: userId,
        read: false,
      });

      return {
        success: true,
        code: 200,
        unRead: unreadCount,
        userId: userId,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al archivar el chat",
        },
      };
    }
  };

  static getChatState = async (
    userId1: string,
    userId2: string,
    requerimentId: string
  ) => {
    try {
      const chatData = await ChatModel.aggregate([
        {
          $match: {
            $and: [
              {
                $or: [
                  {
                    $and: [{ userId: userId1 }, { chatPartnerId: userId2 }],
                  },
                  {
                    $and: [{ userId: userId2 }, { chatPartnerId: userId1 }],
                  },
                ],
              },
              { requerimentId: requerimentId },
            ],
          },
        },
        {
          $addFields: {
            archive: {
              $filter: {
                input: "$archive",
                as: "item",
                cond: { $eq: ["$$item.userId", userId1] }, // <-- o cámbialo si quieres que sea userId2 o ambos
              },
            },
          },
        },
      ]);

      if (chatData.length <= 0) {
        return {
          success: false,
          code: 404,
          res: {
            msg: "No se encontró el chat",
          },
        };
      }

      const userData = await AuthServices.getDataBaseUser(userId2);
      let userName, userImage;

      userName = userData.data?.[0].name;
      userImage = userData.data?.[0].image;
      chatData.forEach((item) => {
        item.userName = userName;
        item.userImage = userImage;
      });

      return {
        success: true,
        code: 200,
        data: chatData,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al archivar el chat",
        },
      };
    }
  };
}
