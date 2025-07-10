import express, { Express } from "express";
import "dotenv/config";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import { RootRouter } from "./routes/RootRouter";

export class App {
  private static instance: Express;

  static getInstance() {
    if (!App.instance) {
      App.instance = express();
      App.instance.use(cookieParser());
      App.instance.use(bodyParser.urlencoded({ extended: false }));
      App.instance.use(bodyParser.json());
      App.instance.use(
        cors({
          origin: process.env.URL_FRONTEND,
          credentials: true,
        })
      );
      App.instance.use(RootRouter.getRouter());
    }
    return App.instance;
  }
}
