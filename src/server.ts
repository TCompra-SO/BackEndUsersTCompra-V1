import { App } from "./app";
import db from "./database/mongo";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { join } from "path";
import jwt from "jsonwebtoken";
import "./utils/cronJobs";
// Declarar `io` en un alcance más amplio
let io: SocketIOServer;
const JWT_SECRET = process.env.JWT_SECRET || "token.01010101";

interface TokenPayload {
  uid: string;
  exp: number;
}

const startApp = async () => {
  const app = App.getInstance();

  // Crear servidor HTTP y Socket.IO
  const server = createServer(app);
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Permitir conexiones desde cualquier origen
    },
  });

  const port = process.env.PORT || 3001;

  db().then(() => console.log("Conectado a la BD"));

  // Cuando un usuario se conecta, se une a la sala 'home'
  io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado", socket.id);

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`Usuario ${socket.id} se unió a la sala ${room}`);
      socket.emit("joinedRoom", `Te has unido a la sala ${room}`);
    });

    // Cuando un usuario se desconecta
    socket.on("disconnect", () => {
      console.log("Usuario desconectado", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`Server running in port ${port}`);
  });
  return io;
};

const init = async () => {
  await startApp();
};

init();

export { io };
