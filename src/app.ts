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

      const allowedOrigins = [
        process.env.URL_FRONTEND,
        process.env.URL_FRONTEND_WWW,
        process.env.API_PRODUCTS,
        process.env.API_SERVICES,
        process.env.API_LIQUIDATIONS,
        process.env.API_USER,
      ];

      App.instance.use(
        cors({
          origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              console.error("Blocked by CORS:", origin);
              callback(new Error("Not allowed by CORS"));
            }
          },
          credentials: true,
        })
      );
      App.instance.use(RootRouter.getRouter());
    }
    return App.instance;
  }
}
