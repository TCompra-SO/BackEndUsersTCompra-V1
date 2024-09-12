import moment from "moment";
import Joi from "joi";
import User from "../models/userModel";
import Company from "../models/companyModel";
import Profile from "../models/profileModel";
import { AuthUserI } from "../interfaces/authUser.interface";
import { AuthServices } from "../services/authServices";
import { encrypt } from "../utils/bcrypt.handle";
import { ErrorMessages } from "../utils/ErrorMessages";
export class subUserServices {
  static SchemaRegister = Joi.object({
    dni: Joi.string().min(8).max(12).required(),
    address: Joi.string().min(3).max(255),
    cityID: Joi.string().required(),
    phone: Joi.string().min(3).max(25),
    email: Joi.string().min(6).max(255).required().email(),
    typeID: Joi.number().required(),
    uid: Joi.string().required(),
  });

  static NewSubUser = async (
    uid: string,
    dni: string,
    address: string,
    cityID: string,
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
                    code: 404,
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
}
