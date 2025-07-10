import cloudinary from "cloudinary";
import dotenv from "dotenv";
import { AuthServices } from "./authServices";
import CompanyModel from "../models/companyModel";
import UserModel from "../models/userModel";
// Cargar variables de entorno desde el archivo .env
dotenv.config();

// Configurar Cloudinary con las credenciales desde .env
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class ImageService {
  /**
   * Sube una imagen a Cloudinary
   * @param filePath - Ruta temporal del archivo (subido por el cliente)
   * @param name - Nombre para el archivo en Cloudinary
   */
  static uploadAvatar = async (filePath: string, uid: string) => {
    try {
      console.log("Subiendo archivo desde ruta:", filePath);

      const dataUser = await AuthServices.getDataBaseUser(uid);
      if (dataUser.success === true) {
        console.log("usuario encontrado");
        const result = await cloudinary.v2.uploader.upload(filePath, {
          folder: "avatars", // Carpeta donde se guardan los avatares en Cloudinary
          public_id: dataUser.data?.[0].uid, // ID único basado en tiempo o nombre personalizado
          resource_type: "image", // Asegura que es una imagen
          type: "upload", // Acceso público
          overwrite: true, // Si ya existe, sobrescribe el archivo
        });
        // Devuelve la URL pública
        const publicUrl = result.secure_url;

        console.log("Imagen subida exitosamente:", publicUrl);

        if (result && result.secure_url) {
          if (dataUser.data?.[0].typeEntity === "Company") {
            const result = await CompanyModel.updateOne(
              { uid: dataUser.data?.[0].uid },
              { avatar: publicUrl }
            );
            if (result.acknowledged && result.modifiedCount > 0) {
              return {
                success: true,
                code: 200,
                url: publicUrl,
              };
            } else {
              return {
                success: false,
                code: 404,
                error: {
                  msg: "Ha ocurrido un error al intentar guardar la ruta de la imagen",
                },
              };
            }
          } else {
            const result = await UserModel.updateOne(
              { uid: dataUser.data?.[0].uid },
              { avatar: publicUrl }
            );
            if (result.acknowledged && result.modifiedCount > 0) {
              return {
                success: true,
                code: 200,
                res: {
                  msg: "La imagen se ha subido correctamente",
                },
                url: publicUrl,
              };
            } else {
              return {
                success: false,
                code: 404,
                error: {
                  msg: "Ha ocurrido un error al intentar guardar la ruta de la imagen",
                },
              };
            }
          }
        } else {
          return {
            success: false,
            code: 403,
            error: {
              msg: "Error al subir la imagen",
            },
          };
        }
      } else {
        return {
          success: false,
          code: 401,
          error: {
            msg: "No se ha podido encontrar el usuario",
          },
        };
      }
    } catch (error) {
      console.error("Error detallado al subir la imagen:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error con el servidor de imagenes",
        },
      };
    }
  };
}
