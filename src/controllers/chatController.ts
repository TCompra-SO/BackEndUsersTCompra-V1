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

      io.to(roomName).emit("updateChat", {
        messageData: responseUser.data,
        type: TypeMessage.NewMessage,
      });
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
    const { messagesIds, chatId } = req.body;
    const responseUser = await ChatService.readMessages(messagesIds, chatId);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
      const roomName = "roomChat" + chatId;

      io.to(roomName).emit("updateChat", {
        messageData: responseUser.data,
        type: TypeMessage.READ,
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
    const { userId, requerimentId } = req.body;
    const responseUser = await ChatService.getChatInfo(userId, requerimentId);
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
