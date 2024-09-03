import { App } from "./app";
import db from "./database/mongo";
const startApp = async () => {
  const app = App.getInstance();

  const port = process.env.PORT || 3000;

  db().then(() => console.log("Conectado a la BD"));
  app.listen(port, () => {
    console.log(`Server running in port ${port}`);
  });
};

startApp();
