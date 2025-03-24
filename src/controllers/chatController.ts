import { Request, Response, response } from "express";
import { io } from "../server";
import { RequestExt } from "../interfaces/req-ext";
import { JwtPayload } from "jsonwebtoken";
import { ChatService } from "../services/chatService";

export const createChatController = async (req: RequestExt, res: Response) => {
  // const { uid } = req.user as JwtPayload;
  try {
    const { userId, requerimentId, title } = req.body;
    const responseUser = await ChatService.createChat(
      userId,
      requerimentId,
      title
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
