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
import { CollectionType, TypeOrder } from "../types/globalTypes";
import dbConnect from "../database/mongo";
import { pipeline } from "stream";
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
      const profile = await Profile.findOne({ uid });

      if (profile) {
        const dataSubUser = await AuthServices.getAuthSubUser(uid);
        const authUsers = dataSubUser.data?.[0]?.auth_users;

        const userData = {
          ...profile.toObject(),
          email: authUsers.email,
          typeID: authUsers.typeID,
        };

        return {
          success: true,
          code: 200,
          data: userData,
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

  static getSubUsers = async (uid: string) => {
    try {
      const countProducts =
        (await this.getCountService(CollectionType.PRODUCTS, uid)) || [];
      const countOffers =
        (await this.getCountService(CollectionType.OFFERS, uid)) || [];

      const countPurchaseOrders =
        (await this.getCountService(CollectionType.PURCHASEORDERS, uid)) || [];
      // Crear un array vacío para almacenar los objetos combinados
      const countPurchaseOrdersProvider = await this.getCountOrders(
        CollectionType.PURCHASEORDERSPRODUCTS,
        uid,
        TypeOrder.PROVIDER
      );

      console.log(countPurchaseOrdersProvider);

      const countServices = 0;
      const countLiquidations = 0;
      const countSellingOrders = 0;
      interface CombinedCount {
        name: string | undefined;
        document: string | undefined;
        typeEntity: string | undefined;
        userID: string | undefined;
        typeID: number | undefined; // Puede ser número o texto, según tus datos
        email: string | undefined;
        createdAt: Date | undefined;
        numProducts: number;
        numOffers: number;
        numPurchaseOrders: number;
        numServices: number;
        numLiquidations: number;
        numSellingOrders: number;
        numPurchaseOrdersProvider: number;
      }

      interface OrderI {
        _id: string;
        count: number;
      }
      const combinedCounts: CombinedCount[] = [];

      // Iterar sobre countProducts para combinar los datos
      for (let i = 0; i < countProducts.length; i++) {
        const product = countProducts[i];

        // Buscar las coincidencias en countOffers y countPurchaseOrders
        const offer = countOffers.find((o) => o.userID === product.userID);
        const purchaseOrder = countPurchaseOrders.find(
          (po) => po.userID === product.userID
        );

        const purchaseOrderProvider = countPurchaseOrdersProvider.data.find(
          (nop: OrderI) => nop._id === product.userID // Ajustar clave según esquema real
        );

        // Crear el objeto combinado
        const combinedObject: CombinedCount = {
          name: product.name,
          document: product.document,
          typeEntity: product.typeEntity,
          userID: product.userID,
          typeID: product.typeID,
          email: product.email,
          createdAt: product.createdAt,
          numProducts: product.total,
          numOffers: offer ? offer.total : 0, // Si no se encuentra, asignar 0
          numPurchaseOrders: purchaseOrder ? purchaseOrder.total : 0, // Si no se encuentra, asignar 0
          numServices: countServices,
          numLiquidations: countLiquidations,
          numSellingOrders: countSellingOrders,
          numPurchaseOrdersProvider: purchaseOrderProvider
            ? purchaseOrderProvider.count
            : 0,
        };

        // Agregar el objeto combinado al array
        combinedCounts.push(combinedObject);
      }
      const subUsersCompany = await this.getDataSubUser(uid);

      // Crear el array combinado
      const updatedSubUsers: any[] = subUsersCompany.map((subUser) => {
        // Buscar coincidencia en combinedCounts por userID
        const matchingProduct = combinedCounts.find(
          (product) => product.userID === subUser.auth_users.Uid
        );

        // Crear un objeto combinado
        return {
          ...subUser.auth_users,
          typeEntity: matchingProduct ? matchingProduct.typeEntity : "SubUser",
          numProducts: matchingProduct ? matchingProduct.numProducts : 0,
          numOffers: matchingProduct ? matchingProduct.numOffers : 0,
          numPurchaseOrdersProvider: matchingProduct
            ? matchingProduct.numPurchaseOrdersProvider
            : 0,
          numServices: countServices,
          numLiquidations: countSellingOrders,
          numSellingOrders: countSellingOrders,
        };
      });

      return {
        success: true,
        code: 200,
        data: updatedSubUsers,
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
  static getDataSubUser = async (uid: string) => {
    //  const companyData = await CompanyModel.find({ uid }).lean();
    const companyData = await CompanyModel.aggregate([
      {
        $match: { uid }, // Filtra por el uid en la colección Companys
      },
      {
        $unwind: "$auth_users", // Descompone el array de auth_users
      },
      {
        $lookup: {
          from: "profiles", // Nombre de la colección Profiles
          localField: "auth_users.Uid", // Campo en Company que se relaciona con Profiles
          foreignField: "uid", // Campo en Profiles que se relaciona con Company
          as: "profileData", // Nombre del nuevo campo con los datos de Profiles
        },
      },
      {
        $unwind: "$profileData", // Descompone el array profileData para acceder a los campos directamente
      },
      {
        $addFields: {
          "auth_users.name": "$profileData.name", // Agrega el campo name de profileData a auth_users
          "auth_users.document": "$profileData.document", // Agrega el campo document de profileData a auth_users
        },
      },
      {
        $project: {
          auth_users: 1, // Mantén los datos de auth_users con los nuevos campos
          _id: 0, // Mantén el _id original
        },
      },
    ]);
    return companyData;
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
          // AQUI DEBERA HACERSE LA SUMA DE TODAS LAS OFERTAS
          collectionData = await mongoose.connection.db.collection(
            "offersproducts"
          );
          uidField = "userID";
          break;
        case CollectionType.PURCHASEORDERS:
          collectionData = await mongoose.connection.db.collection(
            "purchaseorderproducts"
          );
          uidField = "subUserProviderID";
          break;
        default:
          break;
      }

      interface AgrupacionPorUsuario {
        _id: string; // userID
        total: number;
        userID?: string;
        name?: string;
        typeEntity?: string;
        document?: string;
        createdAt?: Date;
        typeID?: number;
        email?: string;
      }

      const resultCount: AgrupacionPorUsuario[] = await collectionData
        .aggregate([
          {
            $match: { entityID: uid }, // Filtra por el entityID proporcionado
          },
          {
            $lookup: {
              from: "profiles", // Nombre de la colección con los datos de los perfiles
              localField: uidField, // Campo de Products que relaciona con Profiles
              foreignField: "uid", // Campo de Profiles que se relaciona con Products
              as: "profileData", // El nombre del campo donde se almacenará la información de Profiles
            },
          },
          {
            $unwind: { path: "$profileData", preserveNullAndEmptyArrays: true }, // Desestructuramos el arreglo profileData
          },
          {
            $lookup: {
              from: "companys", // Segunda búsqueda en uid
              localField: uidField,
              foreignField: "uid",
              as: "companyData", // Datos encontrados en uid
            },
          },
          {
            $unwind: {
              path: "$companyData",
              preserveNullAndEmptyArrays: true,
            }, // Permitir datos vacíos
          },
          {
            $lookup: {
              from: "users", // Buscamos en la colección users si no encontramos en profiles o companys
              localField: uidField, // Relacionamos con el userID de Products
              foreignField: "uid", // Relacionamos con el campo uid de users
              as: "userData", // Almacenamos los datos de users
            },
          },
          {
            $unwind: { path: "$userData", preserveNullAndEmptyArrays: true }, // Desestructuramos el campo userData
          },
          {
            $addFields: {
              name: {
                $ifNull: [
                  "$profileData.name", // Si profileData.name existe, lo toma
                  "$companyData.name", // Si no, intenta companyData.name
                  "$userData.name", // Si no, intenta userData.name
                  "Unknown", // Si todo lo anterior es null, asigna "Unknown"
                ],
              },
              document: {
                $ifNull: [
                  "$profileData.document", // Si profileData.document existe, lo toma
                  "$companyData.document", // Si no, intenta companyData.document
                  "$userData.document", // Si no, intenta userData.document
                  "Unknown", // Si todo lo anterior es null, asigna "Unknown"
                ],
              },
              createdAt: {
                $ifNull: [
                  "$profileData.createdAt", // Si profileData.document existe, lo toma
                  "$companyData.createdAt", // Si no, intenta companyData.document
                  "$userData.createdAt", // Si no, intenta userData.document
                  "Unknown", // Si todo lo anterior es null, asigna "Unknown"
                ],
              },
              email: {
                $ifNull: [
                  "$profileData.email", // Si profileData.document existe, lo toma
                  "$companyData.email", // Si no, intenta companyData.document
                  "$userData.email", // Si no, intenta userData.document
                  "Unknown", // Si todo lo anterior es null, asigna "Unknown"
                ],
              },
              typeID: {
                $ifNull: [
                  "$profileData.typeID", // Si profileData.document existe, lo toma
                  "$companyData.typeID", // Si no, intenta companyData.document
                  "$userData.typeID", // Si no, intenta userData.document
                  "Unknown", // Si todo lo anterior es null, asigna "Unknown"
                ],
              },
              typeEntity: {
                $cond: {
                  if: { $ifNull: ["$profileData.name", false] }, // Si profileData.name existe
                  then: "SubUser", // Asignamos "SubUser" si está en profiles
                  else: {
                    $cond: {
                      if: { $ifNull: ["$companyData.name", false] }, // Si companyData.name existe
                      then: "Company", // Asignamos "Company" si está en companys
                      else: {
                        // Si no se encuentra en profiles ni en companys, asignamos "User"
                        $cond: {
                          if: { $ifNull: ["$userData.name", false] }, // Si userData.name existe
                          then: "User", // Asignamos "User" si está en users
                          else: null, // Si ninguno existe, asignamos null
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          {
            $group: {
              _id: `$${uidField}`, // Agrupamos por userID
              total: { $sum: 1 }, // Contamos los productos
              name: { $first: "$name" }, // Tomamos el primer nombre calculado con $addFields
              typeEntity: { $first: "$typeEntity" }, // Tomamos el primer tipo de entidad calculado con $addFields
              document: { $first: "$document" },
              createdAt: { $first: "$createdAt" },
              email: { $first: "$email" },
              typeID: { $first: "$typeID" },
            },
          },
          {
            $project: {
              _id: 0, // Excluye el campo _id
              userID: "$_id", // Renombra _id a userID
              total: 1, // Incluye el total de productos
              name: 1, // Incluye el nombre
              typeEntity: 1, // Incluye el tipo de entidad
              document: 1,
              createdAt: 1,
              typeID: 1,
              email: 1,
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
