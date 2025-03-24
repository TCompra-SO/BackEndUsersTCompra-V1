import ChatModel from "../models/chatModel";

export class ChatService {
  static createChat = async (
    userId: string,
    requerimentId: string,
    title: string
  ) => {
    try {
      const newChat = new ChatModel({
        userId,
        requerimentId,
        title,
        lastDate: new Date().toISOString(), // Fecha en string
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
        message: "Error al crear el chat",
      };
    }
  };
}
