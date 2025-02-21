import moment from "moment";
import Joi, { any, number } from "joi";
import User from "../models/userModel";
import Company from "../models/companyModel";
import Profile from "../models/profileModel";
import { AuthUserI } from "../interfaces/authUser.interface";
import { AuthServices } from "../services/authServices";
import { encrypt } from "../utils/bcrypt.handle";
import { ErrorMessages } from "../utils/ErrorMessages";
import { getNow } from "../utils/DateTools";
import { ProfileI } from "../interfaces/profile.interface";
import { Console, error } from "console";
import CompanyModel from "../models/companyModel";
import { CollectionType, TypeEntity, TypeOrder } from "../types/globalTypes";
import dbConnect from "../database/mongo";
import { pipeline } from "stream";
import { ResourceCountersI } from "../interfaces/resourceCounters";
import { ResourceCountersService } from "./resourceCountersServices";
import { ResourceCountersModel } from "../models/resourceCountersModel";
export class subUserServices {
  static SchemaRegister = Joi.object({
    dni: Joi.string().min(8).max(12).required(),
    address: Joi.string().min(3).max(255),
    cityID: Joi.number().required(),
    phone: Joi.string().min(3).max(25),
    email: Joi.string().min(6).max(255).required().email(),
    typeID: Joi.number().required(),
    uid: Joi.string().required(),
  });

  static SchemaProfile = Joi.object({
    uid: Joi.string().required(), // Asegúrate de que el campo 'uid' esté aquí
    cityID: Joi.number().optional(),
    address: Joi.string().optional(),
    phone: Joi.string().optional(),
  });

  static NewSubUser = async (
    uid: string,
    dni: string,
    address: string,
    cityID: number,
    phone: string,
    email: string,
    typeID: number
  ) => {
    const emailToVerifyPipeline = [
      {
        $match: {
          $or: [{ email: email }, { "auth_users.email": email }],
        },
      },
      {
        $limit: 1,
      },
    ];

    const docToVerifyPipeline = [
      {
        $match: {
          $and: [
            { document: dni },
            { companyID: uid }, // Compara también el uid
          ],
        },
      },
      {
        $limit: 1,
      },
    ];

    try {
      const { error } = this.SchemaRegister.validate({
        dni,
        cityID,
        email,
        typeID,
        uid,
      });

      if (error) {
        return {
          success: false,
          code: 400,
          error: {
            msg: ErrorMessages(error.details[0].message),
          },
        };
      }

      // Verificar si el email ya está registrado en la colección User
      let emailToVerify = await User.aggregate(emailToVerifyPipeline);

      if (emailToVerify.length === 0) {
        emailToVerify = await Company.aggregate(emailToVerifyPipeline);
        if (emailToVerify.length === 0) {
          // Verificar si el DNI ya está registrado en la colección Profile
          const docToVerify = await Profile.aggregate(docToVerifyPipeline);
          if (docToVerify.length === 0) {
            const responseName = await AuthServices.getNameReniec(dni);
            let fullName = "";

            if (responseName.success) {
              fullName = responseName.data || "";
              const passwordHash = await encrypt(dni);

              const newSubUser: Omit<AuthUserI, "Uid"> = {
                email: email,
                password: passwordHash,
                typeID: typeID,
                ultimate_session: new Date(),
                active_account: true,
              };

              const result = await Company.findOneAndUpdate(
                { uid: uid },
                { $push: { auth_users: newSubUser } },
                { new: true } // Devuelve el documento actualizado
              ).exec();

              if (result) {
                const addedSubUser = result.auth_users.find(
                  (user) => user.email === email
                );

                let subUserUID = addedSubUser?.Uid;
                const resultProfile = await Profile.create({
                  document: dni,
                  name: fullName,
                  phone,
                  address,
                  cityID,
                  uid: subUserUID,
                  companyID: uid,
                });

                if (!resultProfile) {
                  return {
                    success: false,
                    code: 401,
                    error: {
                      msg: "No se ha podido completar el Perfil",
                    },
                  };
                }
                await ResourceCountersModel.updateOne(
                  { uid: uid },
                  {
                    $inc: { numSubUsers: 1 },
                    $set: { updateDate: new Date() },
                  },
                  { upsert: true }
                );
                return {
                  success: true,
                  code: 200,
                  message: "Subusuario agregado exitosamente.",
                };
              } else {
                return {
                  success: false,
                  code: 404,
                  error: {
                    msg: "No se encontró el ID de la compañía para agregar el subusuario.",
                  },
                };
              }
            }
          } else {
            return {
              success: false,
              code: 403,
              error: {
                msg: "DNI ya registrado en la Empresa",
              },
            };
          }
        } else {
          return {
            success: false,
            code: 403,
            error: {
              msg: "Email ya registrado",
            },
          };
        }
      } else {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Email ya registrado",
          },
        };
      }
    } catch (error) {
      console.error("Error en NewSubUser", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor.",
        },
      };
    }
  };

  static getProfileSubUser = async (uid: string) => {
    try {
      // Buscar el perfil del subusuario en la colección de Profiles
      const pipeline = [
        {
          $match: { uid }, // Filtra el documento de Profile por uid
        },
        {
          $lookup: {
            from: "companys", // Colección relacionada
            let: { uid: "$uid" }, // Variable local con el uid de Profile
            pipeline: [
              {
                $unwind: "$auth_users", // Descompone el array auth_users en documentos individuales
              },
              {
                $match: {
                  $expr: { $eq: ["$auth_users.Uid", "$$uid"] }, // Compara auth_users.Uid con el uid de Profile
                },
              },
              {
                $project: {
                  email: "$auth_users.email",
                  typeID: "$auth_users.typeID",
                  _id: 0,
                }, // Solo selecciona el campo email
              },
            ],
            as: "companyData", // Alias para el resultado del lookup
          },
        },
        {
          $addFields: {
            email: { $arrayElemAt: ["$companyData.email", 0] }, // Extrae el email correcto
            typeID: { $arrayElemAt: ["$companyData.typeID", 0] },
          },
        },
        {
          $lookup: {
            from: "resourcecounters", // Colección de ResourceCounters
            localField: "uid", // Campo de Profile
            foreignField: "uid", // Campo de ResourceCounters
            as: "resourceCountersData", // Alias para los datos relacionados
          },
        },
        {
          $unwind: {
            path: "$resourceCountersData", // Descompone el array de resourceCountersData
            preserveNullAndEmptyArrays: true, // Si no hay coincidencia, devuelve null
          },
        },
        {
          $addFields: {
            numProducts: { $ifNull: ["$resourceCountersData.numProducts", 0] }, // Si numProducts es null, poner 0
            numServices: { $ifNull: ["$resourceCountersData.numServices", 0] }, // Si numServices es null, poner 0
            numLiquidations: {
              $ifNull: ["$resourceCountersData.numLiquidations", 0],
            }, // Si numLiquidations es null, poner 0
            numDeleteProducts: {
              $ifNull: ["$resourceCountersData.numDeleteProducts", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numDeleteServices: {
              $ifNull: ["$resourceCountersData.numDeleteServices", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numDeleteLiquidations: {
              $ifNull: ["$resourceCountersData.numDeleteLiquidations", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numPurchaseOrdersProvider: {
              $ifNull: ["$resourceCountersData.numPurchaseOrdersProvider", 0], // Si numPurchaseOrdersProvider es null, poner 0
            },
            numPurchaseOrdersClient: {
              $ifNull: ["$resourceCountersData.numPurchaseOrdersClient", 0], // Si numPurchaseOrdersClient es null, poner 0
            },
            numSaleOrdersProvider: {
              $ifNull: ["$resourceCountersData.numSaleOrdersProvider", 0], // Si numSellingOrdersProvider es null, poner 0
            },
            numSaleOrdersClient: {
              $ifNull: ["$resourceCountersData.numSaleOrdersClient", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numOffersProducts: {
              $ifNull: ["$resourceCountersData.numOffersProducts", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numOffersServices: {
              $ifNull: ["$resourceCountersData.numOffersServices", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numOffersLiquidations: {
              $ifNull: ["$resourceCountersData.numOffersLiquidations", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numDeleteOffersProducts: {
              $ifNull: ["$resourceCountersData.numDeleteOffersProducts", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numDeleteOffersServices: {
              $ifNull: ["$resourceCountersData.numDeleteOffersServices", 0], // Si numSellingOrdersClient es null, poner 0
            },
            numDeleteOffersLiquidations: {
              $ifNull: ["$resourceCountersData.numDeleteOffersLiquidations", 0], // Si numSellingOrdersClient es null, poner 0
            },
          },
        },
        {
          $project: {
            companyData: 0, // Excluye el campo companyData
            resourceCountersData: 0, // Excluye el campo resourceCountersData
          },
        },
      ];

      const profile = await Profile.aggregate(pipeline);

      if (profile.length > 0) {
        /*  const dataSubUser = await AuthServices.getAuthSubUser(uid);
        const authUsers = (dataSubUser.data as any).auth_users;

        const mongoose = require("mongoose");

        let collection = await mongoose.connection.db.collection("products");

        const numProducts = await collection.countDocuments({
          userID: uid,
        });

        collection = await mongoose.connection.db.collection("offersproducts");
        const numOffers = await collection.countDocuments({
          userID: uid,
        });

        collection = await mongoose.connection.db.collection(
          "purchaseorderproducts"
        );

        const numPurchaseOrdersProvider = await collection.countDocuments({
          subUserProviderID: uid,
        });

        const numPurchaseOrdersClient = await collection.countDocuments({
          subUserClientID: uid,
        });

        const numServices = 0;
        const numLiquidations = 0;
        const numSellingOrdersProvider = 0;
        const numSellingOrdersClient = 0;
        console.log(profile);
        const userData = {
           ...profile.toObject(),
          email: authUsers?.email,
          typeID: authUsers?.typeID,
          numProducts: numProducts,
          numServices: numServices,
          numLiquidations: numLiquidations,
          numOffers: numOffers,
          numPurchaseOrdersProvider: numPurchaseOrdersProvider,
          numPurchaseOrdersClient: numPurchaseOrdersClient,
          numSellingOrdersProvider: numSellingOrdersProvider,
          numSellingOrdersClient: numSellingOrdersClient,
        };*/

        return {
          success: true,
          code: 200,
          data: profile,
        };
      } else {
        return {
          success: false,
          code: 404,
          error: {
            msg: "Perfil no encontrado",
          },
        };
      }
    } catch (error) {
      console.error("Error en getProfileSubUser", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor.",
        },
      };
    }
  };

  static updateSubUser = async (data: ProfileI) => {
    const { uid, cityID, address, phone } = data;

    // Validar los datos
    const SchemaUser = this.SchemaProfile.fork(["uid", "cityID"], (field) =>
      field.optional()
    );

    const { error } = SchemaUser.validate(data);
    if (error) {
      return {
        success: false,
        code: 400,
        error: {
          msg: ErrorMessages(error.details[0].message),
        },
      };
    }

    // Buscar el perfil existente
    const profileSubUser = await Profile.findOne({ uid });
    if (!profileSubUser) {
      return {
        success: false,
        code: 409,
        error: {
          msg: "No existe el perfil",
        },
      };
    }

    // Actualizar el perfil del usuario
    try {
      const updatedProfileSubUser = await Profile.findOneAndUpdate(
        { uid }, // Criterio de búsqueda
        {
          $set: {
            cityID,
            address,
            phone,
          },
        }, // Campos a actualizar
        { new: true, runValidators: true } // Devuelve el documento actualizado y ejecuta validaciones
      );

      if (!updatedProfileSubUser) {
        return {
          success: false,
          code: 500,
          error: {
            msg: "Error al actualizar el perfil",
          },
        };
      }

      return {
        success: true,
        code: 200,
        res: {
          msg: "Perfil de usuario actualizado correctamente",
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al actualizar el perfil del SubUsuario",
        },
      };
    }
  };

  static changeStatus = async (uid: string, status: boolean) => {
    try {
      // Buscar la compañía que contenga el subusuario
      const company = await Company.findOne({
        "auth_users.Uid": uid,
      });

      if (!company) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "Subusuario no encontrado en ninguna compañía",
          },
        };
      }

      // Modificar el campo active_account del subusuario
      const updatedCompany = await Company.findOneAndUpdate(
        { "auth_users.Uid": uid },
        {
          $set: {
            "auth_users.$.active_account": status, // Modifica el campo active_account
          },
        },
        { new: true, runValidators: true } // Devuelve el documento actualizado y aplica validaciones
      );

      if (!updatedCompany) {
        return {
          success: false,
          code: 500,
          error: {
            msg: "Error al actualizar el estado del subusuario",
          },
        };
      }

      return {
        success: true,
        code: 200,
        res: {
          msg: "Estado del subusuario actualizado correctamente",
        },
      };
    } catch (error) {
      console.error("Error cambiando el estado del subusuario:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al cambiar el estado del subusuario",
        },
      };
    }
  };

  static changeRole = async (uid: string, typeID: number) => {
    console.log("tipo: " + typeID);
    try {
      if (typeID === 1) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "No se puede asignar un rol de tipo ADMIN a una subcuenta",
          },
        };
      }
      // Buscar la compañía que contenga el subusuario
      const company = await Company.findOne({
        "auth_users.Uid": uid,
      });

      if (!company) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "Subusuario no encontrado en ninguna compañía",
          },
        };
      }

      // Modificar el campo typeID del subusuario
      const updatedCompany = await Company.findOneAndUpdate(
        { "auth_users.Uid": uid },
        {
          $set: {
            "auth_users.$.typeID": typeID, // Modifica el campo active_account
          },
        },
        { new: true, runValidators: true } // Devuelve el documento actualizado y aplica validaciones
      );

      if (!updatedCompany) {
        return {
          success: false,
          code: 500,
          error: {
            msg: "Error al actualizar el estado del subusuario",
          },
        };
      }

      return {
        success: true,
        code: 200,
        res: {
          msg: "Estado del subusuario actualizado correctamente",
        },
      };
    } catch (error) {
      console.error("Error cambiando el estado del subusuario:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al cambiar el estado del subusuario",
        },
      };
    }
  };

  static getSubUsers = async (uid: string, page: number, limit: number) => {
    try {
      if (!page || page < 1) {
        page = 1;
      }
      if (!limit || limit < 1) {
        limit = 10;
      }
      const subUsersCompany = await this.getDataSubUser(uid, page, limit);

      return {
        success: true,
        code: 200,
        data: subUsersCompany.data,
        res: subUsersCompany.res,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Ha ocurrido un Error interno con el Servidor",
        },
      };
    }
  };
  static getDataSubUser = async (
    uid: string,
    page: number,
    pageSize: number
  ) => {
    //  const companyData = await CompanyModel.find({ uid }).lean();

    const skip = (page - 1) * pageSize; // Cálculo de documentos a omitir
    const pipeline = [
      { $match: { uid } },
      { $unwind: "$auth_users" },
      {
        $lookup: {
          from: "profiles",
          localField: "auth_users.Uid",
          foreignField: "uid",
          as: "profileData",
        },
      },
      { $unwind: { path: "$profileData", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          "auth_users.name": { $ifNull: ["$profileData.name", ""] },
          "auth_users.document": { $ifNull: ["$profileData.document", ""] },
          "auth_users.createdAt": { $ifNull: ["$profileData.createdAt", null] },
        },
      },
      {
        $lookup: {
          from: "resourcecounters",
          localField: "auth_users.Uid",
          foreignField: "uid",
          as: "resourceCounterData",
        },
      },
      {
        $unwind: {
          path: "$resourceCounterData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "auth_users.numProducts": {
            $ifNull: ["$resourceCounterData.numProducts", 0],
          },
          "auth_users.numOffers": {
            $ifNull: ["$resourceCounterData.numOffers", 0],
          },
          "auth_users.numServices": {
            $ifNull: ["$resourceCounterData.numServices", 0],
          },
          "auth_users.numLiquidations": {
            $ifNull: ["$resourceCounterData.numLiquidations", 0],
          },
          "auth_users.numSellingOrdersProvider": {
            $ifNull: ["$resourceCounterData.numSellingOrdersProvider", 0],
          },
          "auth_users.numSellingOrdersClient": {
            $ifNull: ["$resourceCounterData.numSellingOrdersClient", 0],
          },
          "auth_users.numPurchaseOrdersProvider": {
            $ifNull: ["$resourceCounterData.numPurchaseOrdersProvider", 0],
          },
          "auth_users.numPurchaseOrdersClient": {
            $ifNull: ["$resourceCounterData.numPurchaseOrdersClient", 0],
          },
          "auth_users.typeEntity": {
            $ifNull: ["$resourceCounterData.typeEntity", "SubUser"],
          },
        },
      },
      {
        $project: {
          _id: 0,
          name: "$auth_users.name",
          document: "$auth_users.document",
          typeEntity: "$auth_users.typeEntity",
          userID: "$auth_users.Uid",
          typeID: "$auth_users.typeID",
          email: "$auth_users.email",
          createdAt: "$auth_users.createdAt",
          numProducts: "$auth_users.numProducts",
          numOffers: "$auth_users.numOffers",
          numServices: "$auth_users.numServices",
          numLiquidations: "$auth_users.numLiquidations",
          numSellingOrdersProvider: "$auth_users.numSellingOrdersProvider",
          numSellingOrdersClient: "$auth_users.numSellingOrdersClient",
          numPurchaseOrdersProvider: "$auth_users.numPurchaseOrdersProvider",
          numPurchaseOrdersClient: "$auth_users.numPurchaseOrdersClient",
        },
      },
    ];
    const companyData = await CompanyModel.aggregate([
      ...pipeline,
      {
        $sort: {
          publish_date: -1, // Orden descendente (más reciente primero)
        },
      },
      { $skip: skip }, // Omite los documentos según la página
      { $limit: pageSize }, // Limita el número de documentos por página
    ]);

    // Obtener el número total de documentos (sin paginación)
    const totalData = await CompanyModel.aggregate(pipeline);
    const totalDocuments = totalData.length;

    return {
      data: companyData,
      res: {
        totalDocuments,
        totalPages: Math.ceil(totalDocuments / pageSize),
        currentPage: page,
        pageSize,
      },
    };
  };
  static getCountService = async (service: CollectionType, uid: string) => {
    const mongoose = require("mongoose");
    let uidField;
    let collectionData;

    try {
      switch (service) {
        case CollectionType.PRODUCTS:
          collectionData = await mongoose.connection.db.collection("products");
          uidField = "userID";
          break;
        case CollectionType.SERVICES:
          collectionData = await mongoose.connection.db.collection("services");
          uidField = "userID";
          break;
        case CollectionType.LIQUIDATIONS:
          collectionData = await mongoose.connection.db.collection(
            "liquidations"
          );
          uidField = "userID";
          break;
        case CollectionType.OFFERS:
          collectionData = await mongoose.connection.db.collection(
            "offersproducts"
          );
          uidField = "userID";
        default:
          break;
      }

      const resultCount = await collectionData
        .aggregate([
          {
            $match: { entityID: uid }, // Filtra por el entityID proporcionado
          },
          {
            $group: {
              _id: `$${uidField}`, // Agrupa por el campo uidField
              total: { $sum: 1 }, // Cuenta los registros
            },
          },
          {
            $project: {
              _id: 0, // Excluye el campo _id
              userID: "$_id", // Renombra _id a userID
              total: 1, // Incluye el total
            },
          },
        ])
        .toArray();

      return resultCount;
    } catch (error) {
      console.error(error);
    }
  };

  static getCountOrders = async (
    service: CollectionType,
    uid: string,
    typeOrder: TypeOrder
  ) => {
    try {
      let collectionData;
      const mongoose = require("mongoose");
      collectionData = await mongoose.connection.db.collection(service);
      // Pipeline de agregación
      let pipeline;
      if (typeOrder === TypeOrder.PROVIDER) {
        pipeline = [
          { $match: { userProviderID: uid } }, // Filtra por userProviderID
          {
            $group: {
              _id: "$subUserProviderID", // Agrupa por subUserProviderID
              count: { $sum: 1 }, // Cuenta los documentos en cada grupo
            },
          },
        ];
      } else {
        pipeline = [
          { $match: { userClientID: uid } }, // Filtra por userProviderID
          {
            $group: {
              _id: "$subUserClientID", // Agrupa por subUserProviderID
              count: { $sum: 1 }, // Cuenta los documentos en cada grupo
            },
          },
        ];
      }

      // Ejecutar la agregación
      const resulData = await collectionData.aggregate(pipeline).toArray();
      return {
        success: true,
        code: 200,
        data: resulData,
      };
    } catch (error) {
      console.log("Error en getCountOrders:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error en el servidor",
        },
      };
    }
  };
}
