import { Router } from "express";
import { checkJwt } from "../middleware/session";
import { createChatController } from "../controllers/chatController";
export class ChatRouter {
  private static instance: ChatRouter;
  private router: Router;

  private constructor() {
    this.router = Router();

    this.router.post("/createChat", createChatController);
  }

  static getRouter(): Router {
    if (!ChatRouter.instance) {
      ChatRouter.instance = new ChatRouter();
    }
    return ChatRouter.instance.router;
  }
}
