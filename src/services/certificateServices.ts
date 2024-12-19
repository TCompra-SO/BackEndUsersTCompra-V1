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
import CompanyModel from "../models/companyModel";

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
      const resultData = await CertificateModel.find({ companyID }).select(
        "-request"
      );
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
      const resultData = await CertificateModel.findOne({
        uid: certificateID,
      }).select("-request");
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
    resend?: boolean
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
      const cerRequestData = await CertificateRequestModel.find({
        receiverEntityID: companyID,
        sendByentityID: userID,
        state: { $nin: [CertificationState.REJECTED] },
      });

      if (
        cerRequestData?.[0]?.state === CertificationState.PENDING ||
        cerRequestData?.[0]?.state === CertificationState.CERTIFIED
      ) {
        let state;
        if (cerRequestData?.[0]?.state === CertificationState.PENDING) {
          state = "Tienes una certificación Pendiente con esta empresa";
          console.log(cerRequestData?.[0].uid);
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
          name: certificate.name,
          documentName: certificate.documentName,
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
      };
      await this.createCertificateRequest(newRequestData);
      /*
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
      }*/

      return {
        success: true,
        code: 200,
        res: {
          msg: "Solicitud enviada con éxito",
        },
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
    note?: string
  ) => {
    try {
      if (state === CertificationState.REJECTED) {
        if (!note || note.length < 1) {
          return {
            success: false,
            code: 401,
            error: {
              msg: "No ha ingresado el motivo",
            },
          };
        }
      }
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

  static getReceivedRequestsByEntity = async (companyID: string) => {
    try {
      const result = await CertificateRequestModel.find({
        receiverEntityID: companyID,
      });
      console.log(result);
      const resultData = await CertificateRequestModel.aggregate([
        {
          $match: { receiverEntityID: companyID },
        },
        {
          $lookup: {
            from: "companys", // El nombre de la colección de la tabla 'Company'
            localField: "sendByentityID", // Campo de la colección 'RequestModel' (recibe el ID)
            foreignField: "uid", // Campo de la colección 'Company' (campo de unión)
            as: "companyDetails", // El nombre del campo que almacenará la información de la tabla 'Company'
          },
        },
        {
          $unwind: "$companyDetails", // Descompone el arreglo de la respuesta del $lookup para que se pueda acceder a los campos de la empresa
        },
        {
          $project: {
            uid: 1,
            companyId: "$sendByentityID", // Incluir el campo 'name'
            companyName: "$companyDetails.name",
            companyDocument: "$companyDetails.document",
            creationDate: "$createdAt", // Incluir el campo 'status'
            note: 1, // Incluir '_id' (se incluye por defecto si no se excluye)
            state: 1,
            certificates: 1,
          },
        },
      ]);
      return {
        success: true,
        code: 200,
        data: resultData,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al obtener las solicitudes",
        },
      };
    }
  };

  static getSentRequestsByEntity = async (companyID: string) => {
    try {
      const resultData = await CertificateRequestModel.aggregate([
        {
          $match: { sendByentityID: companyID },
        },
        {
          $lookup: {
            from: "companys", // El nombre de la colección de la tabla 'Company'
            localField: "receiverEntityID", // Campo de la colección 'RequestModel' (recibe el ID)
            foreignField: "uid", // Campo de la colección 'Company' (campo de unión)
            as: "companyDetails", // El nombre del campo que almacenará la información de la tabla 'Company'
          },
        },
        {
          $unwind: "$companyDetails", // Descompone el arreglo de la respuesta del $lookup para que se pueda acceder a los campos de la empresa
        },
        {
          $project: {
            uid: 1,
            companyId: "$receiverEntityID", // Incluir el campo 'name'
            companyName: "$companyDetails.name",
            companyDocument: "$companyDetails.document",
            creationDate: "$createdAt", // Incluir el campo 'status'
            note: 1, // Incluir '_id' (se incluye por defecto si no se excluye)
            state: 1,
            certificates: 1,
          },
        },
      ]);

      return {
        success: true,
        code: 200,
        data: resultData,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al obtener las solicitudes",
        },
      };
    }
  };

  static deleteCertificateByID = async (certificateID: string) => {
    try {
      const resultData = await CertificateModel.findOne({ uid: certificateID });
      if (resultData) {
        this.deleteFileFromCloudinary(resultData.url);
        await CertificateModel.deleteOne({ uid: certificateID });
      } else {
        return {
          success: false,
          code: 400,
          error: {
            msg: "No se ha encontrado el Certificado",
          },
        };
      }

      return {
        success: true,
        code: 200,
        data: resultData,
        res: {
          msg: "Certificado eliminado con éxito",
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al obtener las solicitudes",
        },
      };
    }
  };

  // Función para eliminar un archivo
  static deleteFileFromCloudinary = async (url: string) => {
    // Verificar si la URL no es undefined o null antes de usarla

    const path = url.split("/upload/")[1];

    // Eliminar la versión (v...) si existe
    const publicId = path.split("/").slice(1).join("/");

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw", // Importante para archivos no procesados (PDF, Word, etc.)
      });
    } catch (error) {
      console.error("Error al eliminar el archivo:", error);
    }
  };

  static resendCertify = async (
    certificateRequesID: string,
    certificateIDs: [string]
  ) => {
    try {
      const resultData = await CertificateRequestModel.findOne({
        uid: certificateRequesID,
      });

      if (resultData?.state === CertificationState.RESENT) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Ya has reenviado la solicitud",
          },
        };
      }

      if (
        resultData?.state !== CertificationState.PENDING &&
        resultData?.state !== CertificationState.CERTIFIED
      ) {
        const certificates = await CertificateModel.find({
          uid: { $in: certificateIDs },
        });

        // Copiar Certificado
        const folder = "certificates-request";
        const resultCerts: { uid: string; state: number; url: string }[] = [];
        let urlCer: string;
        for (const certificate of certificates) {
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
            name: certificate.name,
            documentName: certificate.documentName,
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
        const updatedRequest = CertificateRequestModel.updateOne(
          { uid: certificateRequesID }, // Filtrar por el 'uid' del documento
          {
            $set: {
              state: CertificationState.RESENT, // Nuevo estado
              certificates: resultCerts, // Nuevo array de certificados
            },
          }
        );

        if ((await updatedRequest).modifiedCount === 0) {
          return {
            success: false,
            code: 404,
            error: {
              msg: "No se realizó ninguna actualización",
            },
          };
        }
      }

      return {
        success: true,
        code: 200,
        res: {
          msg: "la solicitud de reenvio se ha realizado con éxito",
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al obtener las solicitudes",
        },
      };
    }
  };

  static updateRequireddDocuments = async (
    companyID: string,
    requiredDocuments: string
  ) => {
    try {
      // Actualizar los documentos requeridos para la compañía especificada
      const updateData = await CompanyModel.updateOne(
        { uid: companyID }, // Filtro: Buscar por el ID de la compañía
        { $set: { requiredDocuments } } // Actualización: Establecer los nuevos documentos requeridos
      );

      if (updateData.matchedCount === 0) {
        // Si no se encuentra la compañía
        return {
          success: false,
          code: 404,
          error: {
            msg: "Registro no encontrado",
          },
        };
      }

      return {
        success: true,
        code: 200,
        res: {
          msg: "Los documentos requeridos se han actualizado con éxito",
        },
      };
    } catch (error) {
      console.error("Error updating required documents:", error); // Log para depuración
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al actualizar los documentos requeridos",
        },
      };
    }
  };

  static getRequiredDocuments = async (companyID: string) => {
    try {
      // Buscar la compañía por su ID utilizando findOne
      const company = await CompanyModel.findOne(
        { uid: companyID }, // Filtro por companyID
        "uid name requiredDocuments"
      );

      // Si no se encuentra la compañía
      if (!company) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "Registro no encontrado",
          },
        };
      }

      // Si la compañía existe, devolver los documentos requeridos
      return {
        success: true,
        code: 200,
        data: company, // Devuelve los documentos requeridos
      };
    } catch (error) {
      console.error("Error retrieving required documents:", error); // Log para depuración
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al recuperar los documentos requeridos",
        },
      };
    }
  };
}
