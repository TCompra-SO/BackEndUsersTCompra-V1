import axios from "axios";
import fs from "fs";
import path from "path";

// Control de concurrencia para evitar múltiples solicitudes simultáneas
let isProcessing = false;

// Función para pausar un tiempo determinado
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Leer el archivo infoChat.md con contenido base
const readReadme = (filePath: string): string => {
  return fs.readFileSync(filePath, "utf8");
};

// Función que envía el mensaje a Groq y retorna la respuesta o false
const sendMessage = async (
  message: string,
  readmeContent: string
): Promise<string | false> => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192", // Puedes cambiarlo por otro modelo de Groq si quieres
        messages: [
          {
            role: "system",
            content: `
Eres un asistente que ayuda a los usuarios de una app llamada "TCOMPRA". 
Solo puedes responder preguntas relacionadas con el uso, funcionamiento o problemas de TCOMPRA.
Solo puedes responder en el idioma Español.

Aquí tienes un tutorial detallado sobre cómo usar la app. Usa esta información para responder preguntas:

${readmeContent}

Si el usuario hace una pregunta fuera del contexto de TCOMPRA, responde:
"Lo siento, solo puedo responder preguntas relacionadas con TCOMPRA."
Evita comenzar las respuestas con "según el tutorial o guía del usuario"
            `,
          },
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.choices[0].message.content.trim();
    return result || false;
  } catch (error: any) {
    console.error(
      "❌ Error en sendMessage():",
      error.response?.data || error.message
    );
    return false;
  }
};

// Función principal que maneja la lógica de reintento con espera incremental
const getChatResponse = async (message: string): Promise<string> => {
  if (isProcessing) {
    return "Por favor espera a que termine la respuesta anterior.";
  }

  isProcessing = true;

  try {
    const readmeContent = readReadme(path.join(__dirname, "infoChat.md"));

    let totalWaitTime = 0;
    let waitTime = 3000; // Empieza con 5 segundos
    const maxWaitTime = 20000; // Límite de 20 segundos
    let result: string | false = false;

    while (!result && totalWaitTime <= maxWaitTime) {
      console.log(`⌛ Esperando ${waitTime / 1000}s antes de enviar...`);
      await delay(waitTime);
      totalWaitTime += waitTime;

      result = await sendMessage(message, readmeContent);

      if (!result) {
        waitTime += 2000; // Aumentar el tiempo para el próximo intento
      }
    }

    return (
      result || "No se pudo obtener una respuesta después de varios intentos."
    );
  } catch (error: any) {
    console.error(
      "❌ Error general en getChatResponse:",
      error.message || error
    );
    return "Hubo un error al procesar tu solicitud. Intenta nuevamente.";
  } finally {
    isProcessing = false;
  }
};

export default getChatResponse;
