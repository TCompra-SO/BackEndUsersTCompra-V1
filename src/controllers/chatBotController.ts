// src/controllers/chatBotController.ts
import { Request, Response } from "express";
import getChatResponse from "../utils/chatBotService";

export const chatBotController = async (req: Request, res: Response) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    return res.status(400).json({ error: "Mensaje no proporcionado" });
  }

  try {
    const botReply = await getChatResponse(userMessage);
    res.json({ reply: botReply });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Error procesando la solicitud del chatbot" });
  }
};
