import { Request, Response, response } from "express";
import { io } from "../server";
import { RequestExt } from "../interfaces/req-ext";
import { JwtPayload } from "jsonwebtoken";
import { ChatService } from "../services/chatService";
import { TypeMessage } from "../types/globalTypes";

export const createChatController = async (req: RequestExt, res: Response) => {
  // const { uid } = req.user as JwtPayload;
  try {
    const { userId, requerimentId, title, type } = req.body;
    const responseUser = await ChatService.createChat(
      userId,
      requerimentId,
      title,
      type
    );

    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en createChatController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getChatController = async (req: RequestExt, res: Response) => {
  try {
    const { chatId } = req.params;
    const responseUser = await ChatService.getChat(chatId);

    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en getChatController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const createMessage = async (req: RequestExt, res: Response) => {
  try {
    const { chatId, userId, message } = req.body;
    const responseUser = await ChatService.createMessage(
      chatId,
      userId,
      message
    );

    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
      const roomName = "roomChat" + responseUser.data?.chatId;

      const chatData = await ChatService.getChat(chatId);
      let receivingUser: any;
      if (chatData.data?.userId === userId) {
        receivingUser = chatData.data?.chatPartnerId;
      } else {
        receivingUser = chatData.data?.userId;
      }
      let unReadreivingUser = await ChatService.getCountUnReadByUser(
        receivingUser,
        chatId
      );
      const numUnReads = await ChatService.getCountMessageUnRead(userId);
      if (!chatData.data?.archive) {
        io.to(roomName).emit("updateChat", {
          messageData: responseUser.data,
          numUnreadMessages: chatData.data?.numUnreadMessages,
          userReceiving: unReadreivingUser.userId,
          unReadreivingUser: unReadreivingUser.unRead,
          type: TypeMessage.NewMessage,
        });

        const roomNameChat = "roomGeneralChat" + responseUser.data?.userId;

        io.to(roomNameChat).emit("updateGeneralChat", {
          numUnreadMessages: numUnReads.data?.[0].totalUnread,
          messageData: responseUser.data,
          chatData: chatData,
          type: TypeMessage.NewMessage,
        });
      }
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en createMessageController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getMessages = async (req: RequestExt, res: Response) => {
  try {
    const { chatId, page, pageSize } = req.body;
    const responseUser = await ChatService.getMessages(
      chatId,
      Number(page),
      Number(pageSize)
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en getMessagesController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getMessage = async (req: RequestExt, res: Response) => {
  try {
    const { messageId } = req.params;
    const responseUser = await ChatService.getMessage(messageId);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en getMessagesController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const readMessages = async (req: RequestExt, res: Response) => {
  try {
    const { messagesIds, chatId, userId } = req.body;
    const responseUser = await ChatService.readMessages(
      messagesIds,
      chatId,
      userId
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
      const roomName = "roomChat" + chatId;
      const numUnReadByChat = await ChatService.getCountUnReadByUser(
        userId,
        chatId
      );
      io.to(roomName).emit("updateChat", {
        messageData: responseUser.data,
        numUnreadMessages: numUnReadByChat.unRead,
        type: TypeMessage.READ,
      });

      const roomNameChat = "roomGeneralChat" + responseUser.data?.userId;

      const numUnReads = await ChatService.getCountMessageUnRead(userId);

      io.to(roomNameChat).emit("updateGeneralChat", {
        numUnreadMessages: numUnReads.data?.[0].totalUnread,
        type: TypeMessage.NewMessage,
      });
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en readMessagesController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getChatUsersDataController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    const { userId, page, pageSize } = req.body;
    const responseUser = await ChatService.getChatUsersData(
      userId,
      Number(page),
      Number(pageSize)
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en readMessagesController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const changeStateConnectionController = async (
  req: RequestExt,
  res: Response
) => {
  try {
    const { userId, online } = req.body;
    const responseUser = await ChatService.changeStateConnection(
      userId,
      Boolean(online)
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
      const roomName = "roomChat" + userId;
      io.to(roomName).emit("updateChat", {
        state: responseUser.state,
      });
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en chageStateConnectionController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getChatInfoController = async (req: RequestExt, res: Response) => {
  try {
    const { userId, userChat, requerimentId } = req.body;
    const responseUser = await ChatService.getChatInfo(
      userId,
      userChat,
      requerimentId
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en chatInfoController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const searchChat = async (req: RequestExt, res: Response) => {
  try {
    const { userId, keyWords } = req.body;
    const responseUser = await ChatService.searchChat(userId, keyWords);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en searchChatController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
export const archiveChatController = async (req: RequestExt, res: Response) => {
  try {
    const { chatId, userId, archive } = req.body;
    const responseUser = await ChatService.archiveChat(chatId, userId, archive);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en sarchiveChatController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getCountMessageUnRead = async (req: RequestExt, res: Response) => {
  try {
    const { userId } = req.params;
    const responseUser = await ChatService.getCountMessageUnRead(userId);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en getCountMessageUnReadController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getCountUnReadByUser = async (req: RequestExt, res: Response) => {
  try {
    const { chatId, userId } = req.body;
    const responseUser = await ChatService.getCountUnReadByUser(userId, chatId);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser);
    }
  } catch (error) {
    console.error("Error en getCountUnReadByUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
