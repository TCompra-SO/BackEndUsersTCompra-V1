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
import { error } from "console";

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
      /*  const result = await AuthServices.getDataBaseUser(uid);
      if (!result.success) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se ha encontrado el usuario",
          }
        }
      }
      const typeEntity = result.data?.[0].typeEntity;*/
      const subUsersData = await Company.aggregate([
        {
          $match: { uid }, // Filtra por el UID proporcionado
        },
        {
          $project: {
            uid: 1, // Incluye el campo 'uid'
            name: 1, // Incluye el campo 'name'
            document: 1, // Incluye el campo 'document'
            auth_users: 1, // Incluye el campo 'auth_users'
          },
        },
      ]);
      return {
        success: true,
        code: 200,
        data: subUsersData,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Ha ocurrido un Error interno con el Servidor",
        },
      };
    }
  };
}
