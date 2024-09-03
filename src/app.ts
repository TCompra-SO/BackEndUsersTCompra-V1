import express, { Express } from "express";
import "dotenv/config";
import cors from "cors";
import bodyParser from "body-parser";
import { RootRouter } from "./routes/RootRouter";

export class App {
  private static instance: Express;

  static getInstance() {
    if (!App.instance) {
      App.instance = express();
      App.instance.use(bodyParser.urlencoded({ extended: false }));
      App.instance.use(bodyParser.json());
      App.instance.use(cors());
      App.instance.use(RootRouter.getRouter());
    }
    return App.instance;
  }
}
