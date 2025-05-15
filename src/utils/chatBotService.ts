import axios from "axios";
import fs from "fs";
import path from "path";

// Control de concurrencia
let isProcessing = false;

// Espera una cantidad de milisegundos
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Lee el contenido del archivo infoChat.md
const readReadme = (filePath: string): string => {
  return fs.readFileSync(filePath, "utf8");
};

// Esta función envía el mensaje al modelo después de esperar 5 segundos
const sendMessage = async (
  message: string,
  readmeContent: string
): Promise<string> => {
  // Espera 5 segundos antes de hacer la petición
  await delay(5000);

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      model: "llama3-8b-8192",
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
Evita comenzar las respuestas con "segun el tutorial o guia del usuario"
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

  return response.data.choices[0].message.content.trim();
};

// Esta es la función principal que se llama desde el frontend
const getChatResponse = async (message: string): Promise<string> => {
  if (isProcessing) {
    return "Por favor espera a que termine la respuesta anterior.";
  }

  isProcessing = true;

  try {
    const readmeContent = readReadme(path.join(__dirname, "infoChat.md"));
    const result = await sendMessage(message, readmeContent);
    return result;
  } catch (error: any) {
    console.error(
      "❌ Error al enviar mensaje:",
      error.response?.data || error.message
    );
    return "Hubo un error al procesar tu solicitud. Intenta nuevamente más tarde.";
  } finally {
    isProcessing = false;
  }
};

export default getChatResponse;
