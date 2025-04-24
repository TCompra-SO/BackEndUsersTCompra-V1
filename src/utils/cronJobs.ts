import { sendEmailCategories } from "./NodeMailer";
import cron from "node-cron";

// Configura el cron job para ejecutar la función 'expired' cada hora (en el minuto 0 de cada hora)
cron.schedule("0 1 * * *", async () => {
  try {
    console.log("Enviando Correos de ultimos Rubros...");
    await sendEmailCategories(); // Llama a la función para actualizar los estados
    console.log("Correos enviados correctamente.");
  } catch (error) {
    console.error("Error al actualizar los estados vencidos:", error);
  }
});
