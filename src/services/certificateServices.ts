//import cloudinary from "cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { AuthServices } from "./authServices";
import CertificateModel from "../models/certificateModel";
import {
  CertificateI,
  CertificationState,
} from "../interfaces/certificate.interface";
import path from "path";
import { error } from "console";
import { CertificateRequestI } from "../interfaces/certificateRequest.interface";
import CertificateRequestModel from "../models/certificateRequestModel";

dotenv.config();

// Configurar Cloudinary con las credenciales desde .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class CertificateService {
  static uploadCertificates = async (
    fileData: { filePath: string; name: string }[],
    companyID: string
  ) => {
    try {
      // Obtener datos del usuario asociado a la empresa

      const dataUser = await AuthServices.getDataBaseUser(companyID);

      if (!dataUser.success) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "No se ha podido encontrar el usuario asociado al ID de la empresa.",
          },
        };
      }

      const userUid = dataUser.data?.[0].uid;

      if (!userUid) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "El usuario no tiene un UID válido.",
          },
        };
      }

      const results = [];

      // Iterar sobre cada documento (cada archivo en filePaths)
      for (const filePath of fileData) {
        try {
          const fileName = path.basename(filePath.filePath); // Obtener solo el nombre del archivo
          const cleanDocumentName = fileName
            .replace(/[^a-zA-Z0-9_-]/g, "")
            .slice(0, 100); // Limitar longitud si es necesario

          // Subir el archivo a Cloudinary
          const result = await cloudinary.uploader.upload(filePath.filePath, {
            folder: "certificates", // Carpeta donde se guardan los documentos en Cloudinary
            public_id: `${userUid}_${Date.now()}_${cleanDocumentName}`.slice(
              0,
              120
            ), // ID único basado en tiempo y nombre limpio
            resource_type: "raw", // Usar "raw" para documentos no imagen
            overwrite: true, // Sobrescribe si ya existe
          });

          const publicUrl = result.secure_url;

          if (!publicUrl) {
            results.push({
              filePath,
              success: false,
              error: "Error al subir el documento a Cloudinary.",
            });
            continue;
          }

          // Crear un nuevo certificado en la base de datos
          const newCertificate = new CertificateModel({
            name: filePath.name,
            url: publicUrl,
            state: CertificationState.NONE,
            companyID: companyID,
            documentName: fileName,
            used: false,
          });

          await newCertificate.save();

          results.push({
            filePath,
            success: true,
            url: publicUrl,
          });
        } catch (error) {
          console.error(`Error al procesar el archivo ${filePath}:`, error);
          results.push({
            filePath,
            success: false,
            error: `Error al procesar el archivo ${filePath}`,
          });
        }
      }

      return {
        success: true,
        code: 200,
        results,
      };
    } catch (error) {
      console.error("Error inesperado al procesar la solicitud:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al procesar la solicitud.",
        },
      };
    }
  };

  static getCertificates = async (companyID: string) => {
    try {
      const resultData = await CertificateModel.find({ companyID });
      return {
        success: true,
        code: 200,
        data: resultData,
      };
    } catch (error) {
      console.error("Error inesperado al obtener los certificados:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al obtener los certificados.",
        },
      };
    }
  };

  static getCertificateById = async (certificateID: string) => {
    try {
      const resultData = await CertificateModel.findOne({ uid: certificateID });
      return {
        success: true,
        code: 200,
        data: resultData,
      };
    } catch (error) {
      console.error("Error inesperado al obtener el certificado:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al obtener el certificado.",
        },
      };
    }
  };

  static sendCertification = async (
    userID: string,
    companyID: string,
    certificateIDs: [string],
    note: string
  ) => {
    try {
      console.log(certificateIDs);
      const userData = await AuthServices.getDataBaseUser(userID);

      //falta corregir esto
      if (userData?.data?.[0]?.auth_users) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "El tipo de usuario no tiene permisos para realizar esta acción",
          },
        };
      }
      const cerRequestData = await CertificateRequestModel.findOne({
        receiverEntityID: companyID,
        sendByentityID: userID,
      });
      console.log(cerRequestData?.state);
      if (
        cerRequestData?.state === CertificationState.PENDING ||
        cerRequestData?.state === CertificationState.CERTIFIED
      ) {
        let state;
        if (cerRequestData?.state === CertificationState.PENDING) {
          state = "Tienes una certificación Pendiente con esta empresa";
        } else {
          state = "Tu empresa se encuentra Certificada con esta empresa";
        }
        return {
          success: false,
          code: 401,
          error: {
            msg: state,
          },
        };
      }
      const certificates = await CertificateModel.find({
        uid: { $in: certificateIDs },
      });

      // Copiar Certificado
      const folder = "certificates-request";
      const resultCerts: { uid: string; state: number; url: string }[] = [];
      let urlCer: string;
      for (const certificate of certificates) {
        console.log("El estado: " + certificate.state);
        if (!certificate.used) {
          const result = await cloudinary.uploader.upload(certificate.url, {
            folder,
          });
          urlCer = result.secure_url;
        } else {
          urlCer = certificate?.urlRequest ?? "";
        }

        // Crear el objeto con los datos necesarios
        const certificateData = {
          uid: certificate.uid, // El UID del certificado
          state: CertificationState.PENDING, // El estado del certificado
          url: urlCer, // La URL segura obtenida de Cloudinary
        };

        // Agregar el objeto a resultCerts
        resultCerts.push(certificateData);
        const updateData = {
          used: true,
          urlRequest: urlCer,
        };
        await this.updateCertificate(certificate.uid, updateData);

        // Guardar solo la URL subida
      }

      // AGREGAR CERTIFICATEREQUEST
      const newRequestData: Omit<CertificateRequestI, "uid"> = {
        certificates: resultCerts, // Asegúrate de que los certificados sean IDs válidos
        state: CertificationState.PENDING, // Asegúrate de que este estado esté definido en CertificationState
        receiverEntityID: companyID,
        sendByentityID: userID,
        note: "Solicitud pendiente de aprobación", // Este campo es opcional
      };

      const responseNewCertificate = (
        await this.createCertificateRequest(newRequestData)
      ).data;

      for (const certificate of certificates) {
        const updateData = {
          request: [
            {
              receiverEntityID: companyID,
              certificateRequestID: responseNewCertificate?.uid,
            },
          ],
        };
        await this.updateCertificate(certificate.uid, updateData);
      }

      return {
        success: true,
        code: 200,
        data: userData,
      };
    } catch (error) {
      console.error("Error inesperado al obtener los certificados:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al obtener los certificados.",
        },
      };
    }
  };

  static copyCertificateToFolder = async (
    url: string,
    targetFolder: string
  ) => {
    try {
      // Extraer el public_id del archivo a partir de la URL
      const publicId = await this.extractPublicIdFromUrl(url);

      if (!publicId) {
        throw new Error("Invalid Cloudinary URL. Could not extract public_id.");
      }

      // Crear el nuevo destino en la carpeta deseada
      const newPublicId = `${targetFolder}/${publicId.split("/").pop()}`;

      // Usar `upload` con la URL original para duplicar el archivo
      const result = await cloudinary.uploader.upload(url, {
        public_id: newPublicId,
      });

      return result.secure_url;
    } catch (error) {
      console.error("Error copying file:", error);
      throw error;
    }
  };

  // Función para extraer el public_id de una URL de Cloudinary
  static extractPublicIdFromUrl = async (url: string) => {
    const matches = url.match(
      /\/v[0-9]+\/([^/]+)\/([^/.]+)\.(?:jpg|jpeg|png|pdf|docx|etc)/
    );
    return matches ? `${matches[1]}/${matches[2]}` : null;
  };

  static updateCertificate = async (uid: string, updateData: any) => {
    try {
      const updateOptions = {};

      // Verificar si solo se envía el campo "request"
      if (
        Object.keys(updateData).length === 1 &&
        updateData.request &&
        Array.isArray(updateData.request)
      ) {
        // Si solo hay un campo y es "request", usamos $push
        Object.assign(updateOptions, {
          $push: { request: { $each: updateData.request } },
        });
      } else {
        // Para otros casos, usamos $set
        Object.assign(updateOptions, { $set: updateData });
      }

      const updatedCertificate = await CertificateModel.findOneAndUpdate(
        { uid }, // Busca por el UID
        updateOptions, // Establece los datos que se actualizarán
        { new: true } // Devuelve el documento actualizado
      );

      if (!updatedCertificate) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "Error al actualizar el Certificado",
          },
        };
      }

      return {
        success: true,
        code: 200,
        data: updatedCertificate,
      };
    } catch (error) {
      console.error("Error inesperado al actualizar datos:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al actualizar el certificado.",
        },
      };
    }
  };

  static createCertificateRequest = async (
    data: Omit<CertificateRequestI, "uid">
  ) => {
    try {
      const newRequest = new CertificateRequestModel(data);
      await newRequest.save();

      return {
        success: true,
        code: 200,
        data: newRequest,
      };
    } catch (error) {
      console.error("Error inesperado al actualizar datos:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al crear Request Certificate.",
        },
      };
    }
  };

  static updateCertificateRequest = async (uid: string, updateData: any) => {
    try {
      // Usamos findOneAndUpdate para encontrar la solicitud por su uid y actualizar los campos
      const updatedRequest = await CertificateRequestModel.findOneAndUpdate(
        { uid }, // Buscar por UID
        { $set: updateData }, // Actualizar los campos proporcionados en updateData
        { new: true } // Devolver el documento actualizado
      );

      if (!updatedRequest) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "Solicitud de certificación no encontrada",
          },
        };
      }
      return {
        success: true,
        code: 200,
        data: updatedRequest,
      };
    } catch (error) {
      console.error("Error inesperado al actualizar datos:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al actualizar los datos.",
        },
      };
    }
  };

  static updateSentCertificateStatus = async (
    certificateRequestID: string,
    certificateID: string,
    state: CertificationState
  ) => {
    try {
      const updatedState = await CertificateRequestModel.updateOne(
        { uid: certificateRequestID, "certificates.uid": certificateID }, // Buscar el documento que tiene el certificado con ese UID
        { $set: { "certificates.$.state": state } } // Actualizar el campo "state" del certificado
      );

      if (updatedState.modifiedCount > 0) {
        return {
          success: true,
          code: 200,
          res: {
            msg: "El estado ha sido actualizado",
          },
        };
      } else {
        return {
          success: false,
          code: 400,
          error: {
            msg: "No se encontró el certificado para actualizar su estado",
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al cambiar el estado del certificado.",
        },
      };
    }
  };

  static updateCertifyState = async (
    certificateRequestID: string,
    state: CertificationState,
    note: string
  ) => {
    try {
      const updateState = await CertificateRequestModel.updateOne(
        { uid: certificateRequestID },
        { $set: { state: state, note: note } }
      );
      if (updateState.modifiedCount > 0) {
        return {
          success: true,
          code: 200,
          res: {
            msg: "El estado ha sido actualizado",
          },
        };
      } else {
        return {
          success: false,
          code: 400,
          error: {
            msg: "No se encontró la solicitud para actualizar su estado",
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al cambiar el estado de la solicitud certificar.",
        },
      };
    }
  };
}
