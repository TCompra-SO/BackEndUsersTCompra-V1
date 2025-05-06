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
import { Console, error } from "console";
import { CertificateRequestI } from "../interfaces/certificateRequest.interface";
import CertificateRequestModel from "../models/certificateRequestModel";
import CompanyModel from "../models/companyModel";
import { ResourceCountersModel } from "../models/resourceCountersModel";
import { CertificationType, OrderType } from "../types/globalTypes";
import { SortOrder } from "mongoose";
import Fuse from "fuse.js";
import { sendEmailCertificate } from "../utils/NodeMailer";

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

          const record = await newCertificate.save();

          results.push({
            filePath,
            success: true,
            url: publicUrl,
            data: record.toObject(),
          });
        } catch (error) {
          console.error(`Error al procesar el archivo ${filePath}:`, error);
          results.push({
            filePath,
            success: false,
            error: `Error al procesar el archivo ${filePath}`,
            data: null,
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

  static getCertificates = async (
    companyID: string,
    page: number,
    pageSize: number
  ) => {
    try {
      const resultData = await CertificateModel.find({ companyID })
        .select("-request")
        .sort({ creationDate: -1 })
        .skip((page - 1) * pageSize) // Saltar los documentos de las páginas anteriores
        .limit(pageSize); // Limitar a la cantidad de documentos por página;

      // Obtener el total de documentos coincidentes
      const totalDocuments = await CertificateModel.countDocuments({
        companyID,
      });

      return {
        success: true,
        code: 200,
        data: resultData,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
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

  static getCertificateById = async (certificateID: string) => {
    try {
      const resultData = await CertificateModel.findOne({
        uid: certificateID,
      });

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
          creationDate: new Date(),
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
      const result = await this.createCertificateRequest(newRequestData);
      // if (result.success)
      return {
        success: true,
        code: 200,
        res: {
          uid: result.data?.uid,
          msg: "Solicitud enviada con éxito",
        },
      };
      // else return result
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
      const certificationData = await CertificateRequestModel.findOne({
        uid: certificateRequestID,
      });

      const updateState = await CertificateRequestModel.findOneAndUpdate(
        { uid: certificateRequestID },
        { $set: { state: state, note: note } },
        { new: true }
      );

      if (updateState) {
        if (
          certificationData?.state !== CertificationState.CERTIFIED &&
          state === CertificationState.CERTIFIED
        ) {
          await ResourceCountersModel.updateOne(
            { uid: certificationData?.receiverEntityID },
            {
              $inc: { numReceivedApprovedCertifications: 1 },
              $set: { updateDate: new Date() },
            },
            { upsert: true }
          );
          await ResourceCountersModel.updateOne(
            { uid: certificationData?.sendByentityID },
            {
              $inc: { numSentApprovedCertifications: 1 },
              $set: { updateDate: new Date() },
            },
            { upsert: true }
          );
        } else if (
          certificationData?.state !== state &&
          certificationData?.state === CertificationState.CERTIFIED
        ) {
          await ResourceCountersModel.updateOne(
            { uid: certificationData?.receiverEntityID },
            {
              $inc: { numReceivedApprovedCertifications: -1 },
              $set: { updateDate: new Date() },
            }
          );

          await ResourceCountersModel.updateOne(
            { uid: certificationData?.sendByentityID },
            {
              $inc: { numSentApprovedCertifications: -1 },
              $set: { updateDate: new Date() },
            }
          );
        }
        const entityID: any = certificationData?.sendByentityID;

        const email = (await AuthServices.getDataBaseUser(entityID)).data?.[0]
          .email;

        if (state === CertificationState.CERTIFIED) {
          sendEmailCertificate(email, true);
        }

        if (state === CertificationState.REJECTED) {
          sendEmailCertificate(email, false);
        }
        //senEmailCertificate()
        return {
          success: true,
          code: 200,
          res: {
            msg: "El estado ha sido actualizado",
            data: updateState,
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

  static getReceivedRequestsByEntity = async (
    companyID: string,
    page: number,
    pageSize: number
  ) => {
    try {
      if (!page || page < 1) page = 1;
      if (!pageSize || pageSize < 1) pageSize = 10;

      const result = await CertificateRequestModel.find({
        receiverEntityID: companyID,
      });

      const pipeline = [
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
      ];

      const resultData = await CertificateRequestModel.aggregate([
        ...pipeline,
        {
          $skip: (page - 1) * pageSize, // Saltar documentos según la página
        },
        {
          $limit: pageSize, // Limitar a la cantidad de documentos por página
        },
      ]);

      const totalDocuments = (await CertificateRequestModel.aggregate(pipeline))
        .length;
      return {
        success: true,
        code: 200,
        data: resultData,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
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

  static getSentRequestsByEntity = async (
    companyID: string,
    page: number,
    pageSize: number
  ) => {
    if (!page || page < 1) page = 1;
    if (!pageSize || pageSize < 1) pageSize = 10;
    try {
      const pipeline = [
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
      ];
      const resultData = await CertificateRequestModel.aggregate([
        ...pipeline,
        {
          $skip: (page - 1) * pageSize, // Saltar documentos según la página
        },
        {
          $limit: pageSize, // Limitar a la cantidad de documentos por página
        },
      ]);

      const totalDocuments = (await CertificateRequestModel.aggregate(pipeline))
        .length;

      return {
        success: true,
        code: 200,
        data: resultData,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
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

  static searchSentRequestsByEntity = async (
    companyID: string,
    page: number,
    pageSize: number,
    keyWords: string,
    orderType: OrderType,
    fieldName: string
  ) => {
    try {
      page = !page || page < 1 ? 1 : page;
      pageSize = !pageSize || pageSize < 1 ? 10 : pageSize;
      let total = 0;
      if (!keyWords) {
        keyWords = "";
      }
      if (!fieldName) {
        fieldName = "creationDate";
      }

      let order: SortOrder = orderType === OrderType.ASC ? 1 : -1;
      //FALTA CORREGIR
      const skip = (page - 1) * pageSize; // Cálculo de documentos a omitir
      /*  const pipeline = [
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
        // Filtro semántico basado en keyWords
        {
          $addFields: {
            certificates: {
              $filter: {
                input: "$certificates",
                as: "cert",
                cond: {
                  $or: [
                    {
                      $regexMatch: {
                        input: "$$cert.documentName",
                        regex: keyWords,
                        options: "i",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$$cert.name",
                        regex: keyWords,
                        options: "i",
                      },
                    },
                  ],
                },
              },
            },
            matchScore: {
              $add: [
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$companyDetails.companyName",
                        regex: keyWords,
                        options: "i",
                      },
                    },
                    1,
                    0,
                  ],
                },

                {
                  $cond: [
                    { $gt: [{ $size: "$certificates" }, 0] }, // Si hay certificados filtrados, suma 1 al score
                    1,
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $match: {
            matchScore: { $gt: 0 }, // Solo deja los documentos que tengan al menos una coincidencia
          },
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
      ];*/
      const pipeline = [
        {
          $match: { sendByentityID: companyID },
        },
        {
          $lookup: {
            from: "companys", // Nombre de la colección de la tabla 'Company'
            localField: "receiverEntityID", // Campo de la colección 'RequestModel'
            foreignField: "uid", // Campo de la colección 'Company'
            as: "companyDetails", // Nombre del campo que almacenará la información de la tabla 'Company'
          },
        },
        {
          $unwind: "$companyDetails", // Descompone el arreglo de la respuesta del $lookup
        },
        {
          $match: {
            $or: [
              { "companyDetails.name": { $regex: keyWords, $options: "i" } }, // Búsqueda insensible a mayúsculas y minúsculas
              {
                "companyDetails.document": { $regex: keyWords, $options: "i" },
              },
            ],
          },
        },
        {
          $project: {
            uid: 1,
            companyId: "$receiverEntityID",
            companyName: "$companyDetails.name",
            companyDocument: "$companyDetails.document",
            creationDate: "$createdAt",
            note: 1,
            state: 1,
            certificates: 1,
          },
        },
      ];
      let certificatesData = await CertificateRequestModel.aggregate([
        ...pipeline,
        {
          $sort: {
            [fieldName]: order, // Orden descendente (más reciente primero)
          },
        },
        { $skip: skip }, // Omite los documentos según la página
        { $limit: pageSize }, // Limita el número de documentos por página
      ]).collation({ locale: "en", strength: 2 });

      let totalDocuments = (await CertificateRequestModel.aggregate(pipeline))
        .length;

      // Obtener el número total de documentos (sin paginación)
      const totalData = await CertificateRequestModel.aggregate(pipeline);
      totalDocuments = totalData.length;
      /*
      // Si no hay resultados en MongoDB, usamos Fuse.js para hacer una búsqueda difusa
      if (keyWords && certificatesData.length === 0) {
        // Crear un nuevo pipeline sin el filtro de palabras clave ($or)
        const pipelineWithoutKeyWords = pipeline
          .map((stage: any, index: number) => {
            if (stage.$match && stage.$match.$or && index !== 0) {
              // Si es un $match con $or y NO es el primer match (el que tiene uid)
              const { $or, ...rest } = stage.$match; // Extrae $or y deja los demás filtros
              return Object.keys(rest).length > 0 ? { $match: rest } : null; // Mantiene otros filtros si existen
            }
            return stage; // Mantiene las demás etapas
          })
          .filter((stage) => stage !== null); // Elimina cualquier etapa vacía

        // Ejecutar el pipeline sin el filtro de palabras clave
        const allResults = await CertificateRequestModel.aggregate(
          pipelineWithoutKeyWords
        );

        // Configurar Fuse.js para la búsqueda difusa
        const fuse = new Fuse(allResults, {
          keys: ["companyName", "companyDocument"], // Claves por las que buscar
          threshold: 0.4, // Define qué tan "difusa" es la coincidencia
        });

        // Buscar usando Fuse.js
        certificatesData = fuse.search(keyWords).map((result) => result.item);

        // Asegurar que fieldName tenga un valor predeterminado antes de ser usado
        const sortField = fieldName ?? "creationDate"; // Si fieldName es undefined, usar "publish_date"

        // Ordenar los resultados por el campo dinámico sortField
        certificatesData.sort((a, b) => {
          const valueA = a[sortField];
          const valueB = b[sortField];

          if (typeof valueA === "string" && typeof valueB === "string") {
            // Usar localeCompare para comparar cadenas ignorando mayúsculas, minúsculas y acentos
            return (
              valueA.localeCompare(valueB, undefined, {
                sensitivity: "base",
              }) * (orderType === OrderType.ASC ? 1 : -1)
            );
          }

          if (valueA > valueB) return orderType === OrderType.ASC ? 1 : -1;
          if (valueA < valueB) return orderType === OrderType.ASC ? -1 : 1;
          return 0; // Si son iguales, no cambiar el orden
        });
        // Total de resultados encontrados
        total = certificatesData.length;
        // Aplicar paginación sobre los resultados ordenados de Fuse.js
        const start = (page - 1) * pageSize;
        certificatesData = certificatesData.slice(start, start + pageSize);
      } else {
        // Si encontramos resultados en MongoDB, el total es la cantidad de documentos encontrados
        const resultData = await CertificateModel.aggregate(pipeline);
        total = resultData.length;
      }*/
      // Si no hay resultados en MongoDB, usamos Fuse.js para hacer una búsqueda difusa

      if (keyWords && certificatesData.length === 0) {
        // Crear un nuevo pipeline sin el filtro de palabras clave ($or)
        const pipelineWithoutKeyWords = [
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
        ];

        // Ejecutar el pipeline sin el filtro de palabras clave
        const allResults = await CertificateRequestModel.aggregate(
          pipelineWithoutKeyWords
        );

        // Configurar Fuse.js para la búsqueda difusa en múltiples campos, incluyendo los certificados
        const fuse = new Fuse(allResults, {
          keys: [
            "companyName",
            "companyDocument", // Búsqueda en el documento del certificado
          ],
          threshold: 0.4, // Define qué tan "difusa" es la coincidencia
          ignoreLocation: true, // Ignorar la posición del término de búsqueda
          findAllMatches: true, // Permitir encontrar múltiples coincidencias
        });

        // Buscar usando Fuse.js
        certificatesData = fuse.search(keyWords).map((result) => result.item);

        // Asegurar que fieldName tenga un valor predeterminado antes de ser usado
        const sortField = fieldName ?? "creationDate"; // Si fieldName es undefined, usar "creationDate"

        // Ordenar los resultados por el campo dinámico sortField
        certificatesData.sort((a, b) => {
          const valueA = a[sortField];
          const valueB = b[sortField];

          if (typeof valueA === "string" && typeof valueB === "string") {
            return (
              valueA.localeCompare(valueB, undefined, {
                sensitivity: "base",
              }) * (orderType === OrderType.ASC ? 1 : -1)
            );
          }

          if (valueA > valueB) return orderType === OrderType.ASC ? 1 : -1;
          if (valueA < valueB) return orderType === OrderType.ASC ? -1 : 1;
          return 0; // Si son iguales, no cambiar el orden
        });

        // Total de resultados encontrados
        total = certificatesData.length;

        // Aplicar paginación sobre los resultados ordenados de Fuse.js
        const start = (page - 1) * pageSize;
        certificatesData = certificatesData.slice(start, start + pageSize);
      } else {
        // Si encontramos resultados en MongoDB, el total es la cantidad de documentos encontrados
        const resultData = await CertificateModel.aggregate(pipeline);
        total = resultData.length;
      }

      return {
        success: true,
        code: 200,
        data: certificatesData,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
      };
    } catch (error) {
      console.error("Error inesperado en el servidor:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado servidor.",
        },
      };
    }
  };

  static searchReceivedRequestsByEntity = async (
    companyID: string,
    page: number,
    pageSize: number,
    keyWords: string,
    orderType: OrderType,
    fieldName: string
  ) => {
    try {
      page = !page || page < 1 ? 1 : page;
      pageSize = !pageSize || pageSize < 1 ? 10 : pageSize;
      let total = 0;
      if (!keyWords) {
        keyWords = "";
      }
      if (!fieldName) {
        fieldName = "creationDate";
      }

      let order: SortOrder = orderType === OrderType.ASC ? 1 : -1;
      //FALTA CORREGIR
      const skip = (page - 1) * pageSize; // Cálculo de documentos a omitir
      /*  const pipeline = [
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
        // Filtro semántico basado en keyWords
        {
          $addFields: {
            certificates: {
              $filter: {
                input: "$certificates",
                as: "cert",
                cond: {
                  $or: [
                    {
                      $regexMatch: {
                        input: "$$cert.documentName",
                        regex: keyWords,
                        options: "i",
                      },
                    },
                    {
                      $regexMatch: {
                        input: "$$cert.name",
                        regex: keyWords,
                        options: "i",
                      },
                    },
                  ],
                },
              },
            },
            matchScore: {
              $add: [
                {
                  $cond: [
                    {
                      $regexMatch: {
                        input: "$companyDetails.companyName",
                        regex: keyWords,
                        options: "i",
                      },
                    },
                    1,
                    0,
                  ],
                },

                {
                  $cond: [
                    { $gt: [{ $size: "$certificates" }, 0] }, // Si hay certificados filtrados, suma 1 al score
                    1,
                    0,
                  ],
                },
              ],
            },
          },
        },
        {
          $match: {
            matchScore: { $gt: 0 }, // Solo deja los documentos que tengan al menos una coincidencia
          },
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
      ];*/
      const pipeline = [
        {
          $match: { receiverEntityID: companyID },
        },
        {
          $lookup: {
            from: "companys", // Nombre de la colección 'Company'
            localField: "sendByentityID", // Campo de la colección 'RequestModel'
            foreignField: "uid", // Campo de la colección 'Company'
            as: "companyDetails",
          },
        },
        {
          $unwind: "$companyDetails",
        },
        // 🔹 Filtro de búsqueda en companyName y companyDocument
        {
          $match: {
            $or: [
              { "companyDetails.name": { $regex: keyWords, $options: "i" } },
              {
                "companyDetails.document": { $regex: keyWords, $options: "i" },
              },
            ],
          },
        },
        {
          $project: {
            uid: 1,
            companyId: "$sendByentityID",
            companyName: "$companyDetails.name",
            companyDocument: "$companyDetails.document",
            creationDate: "$createdAt",
            note: 1,
            state: 1,
            certificates: 1,
          },
        },
      ];
      let certificatesData = await CertificateRequestModel.aggregate([
        ...pipeline,
        {
          $sort: {
            [fieldName]: order, // Orden descendente (más reciente primero)
          },
        },
        { $skip: skip }, // Omite los documentos según la página
        { $limit: pageSize }, // Limita el número de documentos por página
      ]).collation({ locale: "en", strength: 2 });

      let totalDocuments = (await CertificateRequestModel.aggregate(pipeline))
        .length;

      // Obtener el número total de documentos (sin paginación)
      const totalData = await CertificateRequestModel.aggregate(pipeline);
      totalDocuments = totalData.length;

      // Si no hay resultados en MongoDB, usamos Fuse.js para hacer una búsqueda difusa
      if (keyWords && certificatesData.length === 0) {
        // Crear un nuevo pipeline sin el filtro de palabras clave ($or)
        const pipelineWithoutKeyWords = [
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
        ];

        // Ejecutar el pipeline sin el filtro de palabras clave
        const allResults = await CertificateRequestModel.aggregate(
          pipelineWithoutKeyWords
        );

        // Configurar Fuse.js para la búsqueda difusa en múltiples campos, incluyendo los certificados
        const fuse = new Fuse(allResults, {
          keys: [
            "companyName",
            "companyDocument", // Búsqueda en el documento del certificado
          ],
          threshold: 0.4, // Define qué tan "difusa" es la coincidencia
          ignoreLocation: true, // Ignorar la posición del término de búsqueda
          findAllMatches: true, // Permitir encontrar múltiples coincidencias
        });

        // Buscar usando Fuse.js
        certificatesData = fuse.search(keyWords).map((result) => result.item);

        // Asegurar que fieldName tenga un valor predeterminado antes de ser usado
        const sortField = fieldName ?? "creationDate"; // Si fieldName es undefined, usar "creationDate"

        // Ordenar los resultados por el campo dinámico sortField
        certificatesData.sort((a, b) => {
          const valueA = a[sortField];
          const valueB = b[sortField];

          if (typeof valueA === "string" && typeof valueB === "string") {
            return (
              valueA.localeCompare(valueB, undefined, {
                sensitivity: "base",
              }) * (orderType === OrderType.ASC ? 1 : -1)
            );
          }

          if (valueA > valueB) return orderType === OrderType.ASC ? 1 : -1;
          if (valueA < valueB) return orderType === OrderType.ASC ? -1 : 1;
          return 0; // Si son iguales, no cambiar el orden
        });

        // Total de resultados encontrados
        total = certificatesData.length;

        // Aplicar paginación sobre los resultados ordenados de Fuse.js
        const start = (page - 1) * pageSize;
        certificatesData = certificatesData.slice(start, start + pageSize);
      } else {
        // Si encontramos resultados en MongoDB, el total es la cantidad de documentos encontrados
        const resultData = await CertificateModel.aggregate(pipeline);
        total = resultData.length;
      }

      return {
        success: true,
        code: 200,
        data: certificatesData,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
      };
    } catch (error) {
      console.error("Error inesperado en el servidor:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado servidor.",
        },
      };
    }
  };

  static getCertificateRequest = async (uid: string, type?: number) => {
    try {
      if (
        (type &&
          (type == CertificationType.RECEIVED ||
            type == CertificationType.SENT)) ||
        type == undefined
      ) {
        const createPipeline = (
          idField: string,
          companyPrefix: string,
          type?: CertificationType
        ) => [
          {
            $match: { uid: uid },
          },
          {
            $lookup: {
              from: "companys", // El nombre de la colección de la tabla 'Company'
              localField: idField, // Campo de la colección 'RequestModel' (recibe el ID)
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
              [`${type ? "company" : companyPrefix}Id`]: `$${idField}`, // Incluir el campo 'name'
              [`${type ? "company" : companyPrefix}Name`]:
                "$companyDetails.name",
              [`${type ? "company" : companyPrefix}Document`]:
                "$companyDetails.document",
              creationDate: "$createdAt", // Incluir el campo 'status'
              note: 1, // Incluir '_id' (se incluye por defecto si no se excluye)
              state: 1,
              certificates: 1,
            },
          },
        ];

        // Ejecutar el pipeline sin el filtro de palabras clave
        if (type == CertificationType.RECEIVED) {
          const senderPipeline = createPipeline(
            "sendByentityID",
            "sender",
            type
          );
          const senderData = await CertificateRequestModel.aggregate(
            senderPipeline
          );
          return {
            success: true,
            code: 200,
            data: senderData,
          };
        } else if (type == CertificationType.SENT) {
          const receiverPipeline = createPipeline(
            "receiverEntityID",
            "receiver",
            type
          );
          const receiverData = await CertificateRequestModel.aggregate(
            receiverPipeline
          );
          return {
            success: true,
            code: 200,
            data: receiverData,
          };
        }

        const senderPipeline = createPipeline("sendByentityID", "sender");
        const receiverPipeline = createPipeline("receiverEntityID", "receiver");
        const senderData = await CertificateRequestModel.aggregate(
          senderPipeline
        );
        const receiverData = await CertificateRequestModel.aggregate(
          receiverPipeline
        );

        const mergedData = senderData.map((sender) => {
          const receiver = receiverData.find((r) => r.uid === sender.uid) || {};
          return { ...sender, ...receiver };
        });

        return {
          success: true,
          code: 200,
          data: mergedData,
        };
      } else throw new Error("Tipo incorrecto");
    } catch (error) {
      console.error("Error inesperado en el servidor:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado servidor.",
        },
      };
    }
  };

  static transformCertificateRequest = (
    certRequest: any,
    type: CertificationType
  ) => {
    try {
      const fieldName =
        type == CertificationType.RECEIVED ? "receiver" : "sender";
      const companyId = certRequest[`${fieldName}Id`];
      const companyName = certRequest[`${fieldName}Name`];
      const companyDocument = certRequest[`${fieldName}Document`];
      const {
        [`${fieldName}Id`]: _,
        [`${fieldName}Name`]: __,
        [`${fieldName}Document`]: ___,
        ...rest
      } = certRequest;

      return { companyId, companyName, companyDocument, ...rest };
    } catch (e) {
      return null;
    }
  };

  static searchCertificates = async (
    companyID: string,
    page: number,
    pageSize: number,
    keyWords: string,
    orderType: OrderType,
    fieldName: string
  ) => {
    try {
      page = !page || page < 1 ? 1 : page;
      pageSize = !pageSize || pageSize < 1 ? 10 : pageSize;
      let total = 0;
      if (!keyWords) {
        keyWords = "";
      }
      if (!fieldName) {
        fieldName = "creationDate";
      }

      let order: SortOrder = orderType === OrderType.ASC ? 1 : -1;
      //FALTA CORREGIR
      const skip = (page - 1) * pageSize; // Cálculo de documentos a omitir
      const pipeline = [
        { $match: { companyID: companyID } },

        {
          $match: {
            $or: [
              { name: { $regex: keyWords, $options: "i" } },
              { documentName: { $regex: keyWords, $options: "i" } },
            ],
          },
        },

        {
          $project: {
            _id: 0,
          },
        },
      ];
      let certificatesData = await CertificateModel.aggregate([
        ...pipeline,
        {
          $sort: {
            [fieldName]: order, // Orden descendente (más reciente primero)
          },
        },
        { $skip: skip }, // Omite los documentos según la página
        { $limit: pageSize }, // Limita el número de documentos por página
      ]).collation({ locale: "en", strength: 2 });

      // Obtener el número total de documentos (sin paginación)
      const totalData = await CertificateModel.aggregate(pipeline);
      const totalDocuments = totalData.length;

      // Si no hay resultados en MongoDB, usamos Fuse.js para hacer una búsqueda difusa
      if (keyWords && certificatesData.length === 0) {
        // Crear un nuevo pipeline sin el filtro de palabras clave ($or)
        const pipelineWithoutKeyWords = pipeline
          .map((stage: any, index: number) => {
            if (stage.$match && stage.$match.$or && index !== 0) {
              // Si es un $match con $or y NO es el primer match (el que tiene uid)
              const { $or, ...rest } = stage.$match; // Extrae $or y deja los demás filtros
              return Object.keys(rest).length > 0 ? { $match: rest } : null; // Mantiene otros filtros si existen
            }
            return stage; // Mantiene las demás etapas
          })
          .filter((stage) => stage !== null); // Elimina cualquier etapa vacía

        // Ejecutar el pipeline sin el filtro de palabras clave
        const allResults = await CertificateModel.aggregate(
          pipelineWithoutKeyWords
        );

        // Configurar Fuse.js para la búsqueda difusa
        const fuse = new Fuse(allResults, {
          keys: ["name", "documentName"], // Claves por las que buscar
          threshold: 0.4, // Define qué tan "difusa" es la coincidencia
        });

        // Buscar usando Fuse.js
        certificatesData = fuse.search(keyWords).map((result) => result.item);

        // Asegurar que fieldName tenga un valor predeterminado antes de ser usado
        const sortField = fieldName ?? "creationDate"; // Si fieldName es undefined, usar "publish_date"

        // Ordenar los resultados por el campo dinámico sortField
        certificatesData.sort((a, b) => {
          const valueA = a[sortField];
          const valueB = b[sortField];

          if (typeof valueA === "string" && typeof valueB === "string") {
            // Usar localeCompare para comparar cadenas ignorando mayúsculas, minúsculas y acentos
            return (
              valueA.localeCompare(valueB, undefined, {
                sensitivity: "base",
              }) * (orderType === OrderType.ASC ? 1 : -1)
            );
          }

          if (valueA > valueB) return orderType === OrderType.ASC ? 1 : -1;
          if (valueA < valueB) return orderType === OrderType.ASC ? -1 : 1;
          return 0; // Si son iguales, no cambiar el orden
        });
        // Total de resultados encontrados
        total = certificatesData.length;
        // Aplicar paginación sobre los resultados ordenados de Fuse.js
        const start = (page - 1) * pageSize;
        certificatesData = certificatesData.slice(start, start + pageSize);
      } else {
        // Si encontramos resultados en MongoDB, el total es la cantidad de documentos encontrados
        const resultData = await CertificateModel.aggregate(pipeline);
        total = resultData.length;
      }

      return {
        success: true,
        code: 200,
        data: certificatesData,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
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
        const updatedRequest = await CertificateRequestModel.findOneAndUpdate(
          { uid: certificateRequesID }, // Filtrar por el 'uid' del documento
          {
            $set: {
              state: CertificationState.RESENT, // Nuevo estado
              certificates: resultCerts, // Nuevo array de certificados
            },
          },
          { new: true }
        );

        if (!updatedRequest) {
          return {
            success: false,
            code: 404,
            error: {
              msg: "No se realizó ninguna actualización",
            },
          };
        }

        return {
          success: true,
          code: 200,
          res: {
            msg: "la solicitud de reenvio se ha realizado con éxito",
            data: updatedRequest,
          },
        };
      } else {
        return {
          success: false,
          code: 404,
          error: {
            msg: "No se realizó ninguna actualización",
          },
        };
      }
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

  static verifyCertification = async (userID: string, companyID: string) => {
    try {
      //FALTA OBTENER EL MAIN EMPRESA DEL USUARIO LOGEADO
      // Consulta a la base de datos para filtrar por sendByentityID y receiverEntityID

      const result = await CertificateRequestModel.find({
        $and: [
          { sendByentityID: userID }, // sendByentityID debe coincidir
          { receiverEntityID: companyID }, // receiverEntityID debe coincidir
          { state: CertificationState.CERTIFIED },
        ],
      });

      // Verificar si existen resultados
      if (result.length === 0) {
        const requestsData = await CertificateRequestModel.find({
          $and: [
            { sendByentityID: userID }, // sendByentityID debe coincidir
            { receiverEntityID: companyID }, // receiverEntityID debe coincidir
          ],
        }).sort({ updatedAt: -1 });

        let msgState = "";
        let state;

        if (requestsData.length > 0) {
          switch (requestsData[0].state) {
            case CertificationState.PENDING:
              msgState = "Tienes una Certificación Pendiente";
              state = CertificationState.PENDING;
              break;
            case CertificationState.RESENT:
              msgState = "ya has Reenviado una Certificación";
              state = CertificationState.RESENT;
              break;
            case CertificationState.REJECTED:
              msgState = "Tienes una Certificación Rechazada";
              state = CertificationState.REJECTED;
              break;
            default:
              msgState = "No estas certificado con la empresa";
              state = CertificationState.NONE;
              break;
          }
        } else {
          msgState = "No estas certificado con la empresa";
          state = CertificationState.NONE;
        }
        return {
          success: true,
          code: 200,
          error: {
            msg: msgState,
          },
          state: state,
        };
      }

      return {
        success: true,
        code: 200,
        data: result,
        res: {
          msg: "Empresa Certificada",
        },
        state: result[0].state,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado al verificar la certificación",
        },
      };
    }
  };
}
