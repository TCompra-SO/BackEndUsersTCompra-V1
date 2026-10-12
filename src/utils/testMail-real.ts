import * as dotenv from "dotenv";
dotenv.config();

import { sendEmailWelcome } from "./NodeMailer";

(async () => {
  console.log("📤 Enviando correo de prueba...");
  const result = await sendEmailWelcome(
    "contacto@tcompra.com",
    "Prueba Tcompra",
  );
  console.log("Resultado:", result);
})();
