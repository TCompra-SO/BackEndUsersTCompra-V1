import { Router } from "express";
import { checkJwt } from "../middleware/session";
import {
  archiveChatController,
  changeStateConnectionController,
  createChatController,
  createMessage,
  getArchivedChatsBeforeController,
  getArchivedChatsController,
  getChatController,
  getChatInfoController,
  getChatStateController,
  getChatUsersDataBeforeController,
  getChatUsersDataController,
  getCountMessageUnRead,
  getCountUnReadByUser,
  getMessage,
  getMessages,
  getMessagesBefore,
  readMessages,
  searchChat,
} from "../controllers/chatController";
export class ChatRouter {
  private static instance: ChatRouter;
  private router: Router;

  private constructor() {
    this.router = Router();

    this.router.post("/createChat", createChatController);
    this.router.post("/createMessage", createMessage);
    this.router.post("/readMessages", readMessages);
    this.router.post("/getMessages", getMessagesBefore);
    this.router.post("/getChatUsersData", getChatUsersDataBeforeController);
    this.router.post("/getChatInfo", getChatInfoController);
    this.router.post("/searchChat", searchChat);
    this.router.post("/archiveChat", archiveChatController);
    this.router.post("/getCountUnReadByUser", getCountUnReadByUser);
    this.router.post("/getChatState", getChatStateController);
    this.router.get("/getCountMessageUnRead/:userId", getCountMessageUnRead);
    this.router.get("/getChat/:chatId", getChatController);
    this.router.get("/getMessage/:messageId", getMessage);
    this.router.post("/getArchivedChats", getArchivedChatsController);
    this.router.post(
      "/getArchivedChatsBefore",
      getArchivedChatsBeforeController
    );
    this.router.post("/changeStateConnection", changeStateConnectionController);
  }

  static getRouter(): Router {
    if (!ChatRouter.instance) {
      ChatRouter.instance = new ChatRouter();
    }
    return ChatRouter.instance.router;
  }
}
