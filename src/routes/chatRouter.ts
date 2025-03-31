import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
  changeStateConnectionController,
  createChatController,
  createMessage,
  getChatController,
  getChatInfoController,
  getChatUsersDataController,
  getMessage,
  getMessages,
  readMessages,
} from "../controllers/chatController";
export class ChatRouter {
  private static instance: ChatRouter;
  private router: Router;

  private constructor() {
    this.router = Router();

    this.router.post("/createChat", createChatController);
    this.router.post("/createMessage", createMessage);
    this.router.post("/readMessages", readMessages);
    this.router.post("/getMessages", getMessages);
    this.router.post("/getChatUsersData", getChatUsersDataController);
    this.router.post("/getChatInfo", getChatInfoController);
    this.router.get("/getChat/:chatId", getChatController);
    this.router.get("/getMessage/:messageId", getMessage);
    this.router.post("/changeStateConnection", changeStateConnectionController);
  }

  static getRouter(): Router {
    if (!ChatRouter.instance) {
      ChatRouter.instance = new ChatRouter();
    }
    return ChatRouter.instance.router;
  }
}
