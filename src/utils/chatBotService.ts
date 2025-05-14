import axios from "axios";
import fs from "fs";
import path from "path";

// Leer el archivo README
const readReadme = (filePath: string) => {
  return fs.readFileSync(filePath, "utf8");
};

const getChatResponse = async (message: string): Promise<string> => {
  const readmeContent = readReadme(path.join(__dirname, "infoChat.md"));

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions", // URL del proveedor de la API
    {
      model: "llama3-8b-8192", // O el modelo que prefieras
      messages: [
        {
          role: "system",
          content: `
Eres un asistente que ayuda a los usuarios de una app llamada "TCOMPRA". 
Solo puedes responder preguntas relacionadas con el uso, funcionamiento o problemas de TCOMPRA.

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
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content.trim();
};

export default getChatResponse;
