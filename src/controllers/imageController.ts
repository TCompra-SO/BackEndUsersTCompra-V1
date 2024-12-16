import { Request, Response } from "express";
import { ImageService } from "../services/imageServices";
import fs from "fs";
import path from "path";
import multer from "multer";
import { error } from "console";

// Verifica si la carpeta 'uploads' existe y la crea si no
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de Multer para guardar archivos en 'uploads'
export const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 1024 * 1024 * 5, // Limitar a 5MB
  },
  fileFilter: (req, file, cb) => {
    // Filtra solo archivos de imagen
    const filetypes = /jpeg|jpg|png|gif|bmp|webp|tiff|tif|heic|heif|svg|ico/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen") as any, false);
    }
  },
});

export const uploadAvatarController = async (req: Request, res: Response) => {
  try {
    // Obtener el archivo subido desde la request
    const file = req.file;
    const { uid } = req.body;

    if (!file) {
      return res
        .status(400)
        .json({ error: "No se ha proporcionado ninguna imagen" });
    }

    // Subir la imagen a Cloudinary usando el servicio
    const responseUser = await ImageService.uploadAvatar(file.path, uid);

    // Eliminar el archivo temporal después de subirlo a Cloudinary
    fs.unlinkSync(file.path);

    // Enviar la URL de la imagen subida
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.code);
    }
  } catch (error) {
    console.error("Error al subir el avatar:", error);
    res.status(500).json({ error: `Error al subir el avatar: ${error}` });
  }
};
