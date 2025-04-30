import moment from "moment";
import "moment/locale/es"; // Importa el idioma español
moment.locale("es"); // Establece el idioma a español
import Joi, { string } from "joi";
import User from "../models/userModel";
import Company from "../models/companyModel";
import Fuse from "fuse.js";
import { encrypt, verified } from "../utils/bcrypt.handle";
import { ErrorMessages } from "../utils/ErrorMessages";
import axios, { AxiosRequestConfig } from "axios";
import { MetadataI } from "../interfaces/utils.interface";
import { CompanyI } from "../interfaces/company.interface";
import { UserI } from "../interfaces/user.interface";
import { expireInEspecificMinutes, getNow } from "../utils/DateTools";
import bcrypt from "bcrypt";
import {
  sendEmail,
  sendEmailCategories,
  sendEmailRecovery,
} from "../utils/NodeMailer";
import jwt from "jsonwebtoken";
import { error } from "console";
import { matchesGlob } from "path";
import { AuthUserI } from "./../interfaces/authUser.interface";
import { getSubUserController } from "../controllers/subUserController";
import { subUserServices } from "./subUserServices";
import { pipeline } from "stream";
import { configDotenv } from "dotenv";
import { ScoreService } from "./scoreServices";
import { ScoreI } from "./../interfaces/score.interface";
import { TypeEntity, TypeOrder } from "../types/globalTypes";
import CompanyModel from "../models/companyModel";
import mongoose, { Model } from "mongoose";
import { ResourceCountersService } from "./resourceCountersServices";
import { ResourceCountersI } from "../interfaces/resourceCounters";
import { Response } from "express";
import { setToken } from "../utils/authStore";
import UserModel from "../models/userModel";
import { accessTokenExpiresIn, refreshTokenExpiresIn } from "../utils/Globals";
import SessionModel from "../models/sessionModel";
import {
  decodeToken,
  generateRefreshAccessToken,
  generateToken,
  verifyRefreshAccessToken,
  verifyToken,
} from "../utils/jwt.handle";
import { decode } from "punycode";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
export interface UserDocument extends Document {
  _id: string;
  email: string;
  document: string;
  password: string;
  uid: string;
  name: string;
  metadata?: {
    identity_verified?: boolean;
    profile_complete?: boolean;
  };
  active_account: boolean;
  planID: number;
  premiun: boolean;
  typeID: number;
  ultimate_session: string;
}

enum UserType {
  User = 1,
  Company = 0,
}
export class AuthServices {
  static SchemaRegister = Joi.object({
    email: Joi.string().min(6).max(255).required().email(),
    password: Joi.string().min(6).max(1024).required(),
    typeID: Joi.number(),
    dni: Joi.string().min(8).max(12),
    ruc: Joi.string().min(11).max(16),
  });

  static SchemaProfileCompany = Joi.object({
    uid: Joi.string().min(4).max(20).required(),
    phone: Joi.string().min(6).max(20).required(),
    address: Joi.string().min(4).max(100).required(),
    countryID: Joi.number().required(),
    cityID: Joi.number().required(),
    age: Joi.number(),
    specialtyID: Joi.string(),
    about_me: Joi.string().allow("").optional(),
    categories: Joi.array().items(Joi.number()).max(3),
    planID: Joi.number(),
  });

  static SchemaProfileUser = Joi.object({
    uid: Joi.string().min(4).max(20).required(),
    phone: Joi.string().min(6).max(20).required(),
    address: Joi.string().min(4).max(100).required(),
    countryID: Joi.number().required(),
    cityID: Joi.number().required(),
    categories: Joi.array().items(Joi.number()).max(3),
    planID: Joi.number(),
  });

  static SchemaLogin = Joi.object({
    email: Joi.string().min(6).max(255).required().email(),
    password: Joi.string().min(6).max(1024).required(),
  });

  static VerificationNumber = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  static ExpirationDate = (hours: number) => {
    return Math.floor(Date.now() / 1000) + hours * 3600; // 1 hora de expiracion
  };

  static getNameReniec = async (
    dni?: string,
    ruc?: string
  ): Promise<{
    success: boolean;
    code?: number;
    data?: string;
    error?: { msg: string };
  }> => {
    const authToken: string | undefined = process.env.TOKEN_RENIEC;
    let fullName = "";

    if (!authToken) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "AUTH_TOKEN not found in environment variables.",
        },
      };
    }

    const config: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    };

    try {
      if (dni) {
        const apiUrl = `https://api.apis.net.pe/v2/reniec/dni?numero=${dni}`;

        const response = await axios.get(apiUrl, config);

        // Verifica si los datos existen y están correctos
        if (
          response.data &&
          response.data.nombres &&
          response.data.apellidoPaterno &&
          response.data.apellidoMaterno
        ) {
          fullName = `${response.data.nombres} ${response.data.apellidoPaterno} ${response.data.apellidoMaterno}`;
          return {
            success: true,
            data: fullName,
          };
        } else {
          return {
            success: false,
            code: 422,
            error: {
              msg: "DNI no encontrado o formato de respuesta inesperado.",
            },
          };
        }
      } else if (ruc) {
        const apiUrl = `https://api.apis.net.pe/v2/sunat/ruc/full?numero=${ruc}`;
        const response = await axios.get(apiUrl, config);

        // Verifica si los datos existen y están correctos
        if (response.data && response.data.razonSocial) {
          fullName = response.data.razonSocial;
          return {
            success: true,
            data: fullName,
          };
        } else {
          return {
            success: false,
            code: 422,
            error: {
              msg: "RUC no encontrado o formato de respuesta inesperado.",
            },
          };
        }
      } else {
        return {
          success: false,
          code: 400,
          error: {
            msg: "No se proporcionó ni DNI ni RUC.",
          },
        };
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error("Error de Axios:", error.response?.status, error.message);

        // Manejo específico para errores 422 y 404
        if (error.response?.status === 422) {
          return {
            success: false,
            code: 422,
            error: {
              msg: "Documento inválido.",
            },
          };
        } else if (error.response?.status === 404) {
          return {
            success: false,
            code: 404,
            error: {
              msg: "Documento no encontrado.",
            },
          };
        } else {
          return {
            success: false,
            code: error.response?.status || 500,
            error: {
              msg: "Error al consultar la API.",
            },
          };
        }
      } else {
        console.error("Error:", error.message);
        return {
          success: false,
          code: 500,
          error: {
            msg: "Error inesperado.",
          },
        };
      }
    }
  };

  static RegisterNewUser = async (
    email: string,
    password: string,
    typeID: number,
    dni?: string,
    ruc?: string
  ) => {
    try {
      const emailToVerifyPipeline = (emailField: string) => [
        {
          $match: {
            [emailField]: email,
          },
        },
        {
          $limit: 1,
        },
      ];

      const docToVerifyPipeline = [
        {
          $match: {
            document: dni ?? ruc,
          },
        },
        {
          $limit: 1,
        },
      ];

      // Función para verificar email en User, Company (email y auth_users.email)
      const checkEmailExists = async () => {
        const userEmail = await User.aggregate(emailToVerifyPipeline("email"));
        const companyEmail = await Company.aggregate(
          emailToVerifyPipeline("email")
        );
        const companyAuthUsersEmail = await Company.aggregate(
          emailToVerifyPipeline("auth_users.email")
        );

        return (
          userEmail.length > 0 ||
          companyEmail.length > 0 ||
          companyAuthUsersEmail.length > 0
        );
      };

      // Función para verificar documento en User o Company
      const checkDocExists = async (collection: any) => {
        const docExists = await collection.aggregate(docToVerifyPipeline);
        return docExists.length > 0;
      };

      if (dni) {
        const emailExists = await checkEmailExists();
        if (emailExists) {
          return {
            success: false,
            code: 409,
            error: { msg: "Email ya registrado" },
          };
        }

        const docExists = await checkDocExists(User);
        if (docExists) {
          return {
            success: false,
            code: 403,
            error: { msg: "Documento ya registrado" },
          };
        }
      }

      if (ruc) {
        const emailExists = await checkEmailExists();
        if (emailExists) {
          return {
            success: false,
            code: 409,
            error: { msg: "Email ya registrado" },
          };
        }

        const docExists = await checkDocExists(Company);
        if (docExists) {
          return {
            success: false,
            code: 403,
            error: { msg: "Documento ya registrado" },
          };
        }
      }

      const { error } = this.SchemaRegister.validate({
        email,
        password,
        typeID,
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

      const responseName = await this.getNameReniec(dni, ruc);
      let fullName = "";

      if (responseName.success) {
        fullName = responseName.data || "";

        const metadata: MetadataI = {
          identity_verified: false,
          profile_complete: false,
        };

        const passwordHash = await encrypt(password);
        if (ruc) {
          const company = new Company({
            name: fullName,
            email,
            password: passwordHash,
            typeID,
            document: ruc,
            metadata,
          });

          const response = await company.save();
          return {
            success: true,
            code: 200,
            res: response,
          };
        } else {
          const user = new User({
            name: fullName,
            email,
            password: passwordHash,
            typeID,
            document: dni,
            metadata,
          });
          const response = await user.save();
          return {
            success: true,
            code: 200,
            res: response,
          };
        }
      } else {
        return {
          success: false,
          code: 500,
          error: {
            msg: "Error al obtener el Nombre",
          },
        };
      }
    } catch (error: any) {
      console.log(error);
      return {
        success: false,
        code: error.response?.status ?? 500,
        error: {
          msg: "Error at registerUser",
        },
      };
    }
  };

  static CompleteProfileCompany = async (data: CompanyI) => {
    const {
      uid,
      phone,
      address,
      countryID,
      cityID,
      age,
      specialtyID,
      about_me,
      categories,
      planID,
    } = data;

    // Validar los datos
    const { error } = this.SchemaProfileCompany.validate(data);
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
    const profileCompany = await Company.findOne({ uid });
    if (!profileCompany) {
      return {
        success: false,
        code: 409,
        error: {
          msg: "No existe el perfil",
        },
      };
    }

    const metadata: MetadataI = {
      identity_verified: false,
      profile_complete: true,
    };
    // Actualizar el perfil
    try {
      const updatedProfileCompany = await Company.findOneAndUpdate(
        { uid }, // Criterio de búsqueda
        {
          $set: {
            phone,
            address,
            countryID,
            cityID,
            age,
            specialtyID,
            about_me,
            categories,
            planID,
            metadata,
            active_account: true,
          },
        }, // Campos a actualizar
        { new: true, runValidators: true } // Devuelve el documento actualizado y ejecuta validaciones
      );

      if (!updatedProfileCompany) {
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
          msg: "Perfil actualizado correctamente",
        },
      };
    } catch (error) {
      console.error("Error actualizando el perfil:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al actualizar el perfil",
        },
      };
    }
  };

  static CompleteProfileUser = async (data: UserI) => {
    const { uid, phone, address, countryID, cityID, categories, planID } = data;

    // Validar los datos
    const { error } = this.SchemaProfileUser.validate(data);
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
    const profileUser = await User.findOne({ uid });
    if (!profileUser) {
      return {
        success: false,
        code: 409,
        error: {
          msg: "No existe el perfil",
        },
      };
    }
    const metadata: MetadataI = {
      identity_verified: false,
      profile_complete: true,
    };
    // Actualizar el perfil
    try {
      const updatedProfileUser = await User.findOneAndUpdate(
        { uid }, // Criterio de búsqueda
        {
          $set: {
            phone,
            address,
            countryID,
            cityID,
            categories,
            planID,
            metadata,
            active_account: true,
          },
        }, // Campos a actualizar
        { new: true, runValidators: true } // Devuelve el documento actualizado y ejecuta validaciones
      );

      if (!updatedProfileUser) {
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
          msg: "Perfil actualizado correctamente",
        },
      };
    } catch (error) {
      console.error("Error actualizando el perfil:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al actualizar el perfil",
        },
      };
    }
  };

  static SendCodeService = async (
    email: string,
    type: "repassword" | "identity_verified"
  ) => {
    try {
      const UserPipeline = [
        {
          $match: {
            email: email,
          },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            _id: 1,
            email: 1,
            metadata: 1,
          },
        },
      ];

      let user = await User.aggregate(UserPipeline);
      let userType = UserType.User;

      if (!user || user.length == 0) {
        user = await Company.aggregate(UserPipeline);
        userType = UserType.Company;

        if (!user || user.length == 0) {
          user = await Company.aggregate([
            { $unwind: "$auth_users" }, // Desestructura el array
            { $match: { "auth_users.email": email } }, // Filtra por email dentro del array
            {
              $project: {
                _id: 1,
                email: "$auth_users.email",
                metadata: 1,
                uid: 1,
              },
            },
            { $limit: 1 },
          ]);

          if (!user || user.length == 0) {
            return {
              success: false,
              code: 404,
              error: {
                msg: "Usuario no encontrado",
              },
            };
          } else {
            return {
              success: false,
              code: 400,
              error: {
                msg: "Debes contactar al Usuario Principal",
              },
            };
          }
        }
      }

      const uid = user[0]?.uid;

      /// PROFILE

      const now = getNow();
      const expireIn = expireInEspecificMinutes(1);

      const code = this.VerificationNumber();
      // encriptamos codigo
      const salt = await bcrypt.genSalt(10);
      const hashCode = await bcrypt.hash(code, salt);
      ///////////completar
      if (!user[0].metadata?.profile_complete) {
        return {
          success: false,
          code: 410,
          error: {
            msg: "El usuario no ha completado el perfil",
          },
        };
      }
      if (user[0].metadata?.identity_verified === true) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "El usuario ya esta verficado",
          },
        };
      }

      if (new Date(now) < new Date(user[0].metadata?.expireIn)) {
        return {
          success: false,
          code: 409,
          error: {
            msg: `Genera nuevamente ${moment(
              user[0].metadata?.expireIn
            ).fromNow()}`,
          },
        };
      }
      if (type === "identity_verified") {
        try {
          if (user[0].metadata?.identity_verified) {
            return {
              success: false,
              code: 410,
              error: {
                msg: "Este usuario ya esta verificado",
              },
            };
          }

          sendEmail(email, code);
          if (userType === UserType.User) {
            await User.findOneAndUpdate(
              { email },
              {
                "metadata.code": hashCode,
                "metadata.expireIn": expireIn,
              }
            );
          } else {
            await Company.findOneAndUpdate(
              { email },
              {
                "metadata.code": hashCode,
                "metadata.expireIn": expireIn,
              }
            );
          }

          return {
            success: true,
            code: 200,
            res: {
              msg: "Código de verificación enviado por correo",
              uid: user[0].uid,
            },
          };
        } catch (error) {
          return {
            success: false,
            code: 500,
            error: {
              msg: "Error at identity_verified",
            },
          };
        }
      }

      if (!user[0].metadata?.identity_verified) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Verifica tu cuenta",
          },
        };
      }

      if (user[0].metadata?.repassword) {
        return {
          success: false,
          code: 410,
          error: {
            msg: "Usuario ya validado",
          },
        };
      }

      sendEmail(email, code);
      if (userType == UserType.User)
        await User.findOneAndUpdate(
          { email },
          {
            "metadata.code": hashCode,
            "metadata.expireIn": expireIn,
          }
        );
      else
        await Company.findOneAndUpdate(
          { email },
          {
            "metadata.code": hashCode,
            "metadata.expireIn": expireIn,
          }
        );

      return {
        success: true,
        code: 200,
        res: {
          msg: "Código de recuperación enviado",
          uid: user[0].uid,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error at SendCode",
        },
      };
    }
  };

  static ValidateCodeService = async (
    email: string,
    code: string,
    type: "repassword" | "identity_verified"
  ) => {
    try {
      const iniUserPipeline = [
        {
          $match: {
            email: email,
          },
        },
        {
          $limit: 1,
        },
      ];

      let user = await User.aggregate(iniUserPipeline);
      let userType = UserType.User;
      if (!user || user.length === 0) {
        user = await Company.aggregate(iniUserPipeline);
        userType = UserType.Company;

        if (!user || user.length === 0) {
          return {
            success: false,
            code: 404,
            error: {
              msg: "Usuario no encontrado",
            },
          };
        }
      }

      // Verificar si el usuario ya está verificado
      if (user[0].metadata?.identity_verified) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "El usuario ya está verificado",
          },
        };
      }

      if (!user[0].metadata?.code) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "Este usuario no tiene código de validación",
          },
        };
      }

      const now = getNow();
      if (new Date(now) > new Date(user[0].metadata.expireIn)) {
        return {
          success: false,
          code: 410,
          error: {
            msg: "El código ha expirado, vuelve a generar otro",
          },
        };
      }

      const hashCode = await bcrypt.compare(code, user[0].metadata.code);
      if (!hashCode) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "El código ingresado es el incorrecto",
          },
        };
      }

      let update;
      if (type === "repassword") {
        update = { "metadata.repassword": true };
      } else if (type === "identity_verified") {
        update = {
          $unset: {
            "metadata.code": 1,
            "metadata.expireIn": 1,
          },
          $set: { "metadata.identity_verified": true },
        };
      }

      // Verifica si `update` está definido
      if (!update) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "Tipo de actualización no válido",
          },
        };
      }

      // Realiza la actualización
      const updateResult =
        userType === UserType.User
          ? await User.updateOne({ email: email }, update)
          : await Company.updateOne({ email: email }, update);

      if (updateResult.modifiedCount === 0) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "No se pudo actualizar el usuario",
          },
        };
      }

      return {
        success: true,
        code: 200,
        res: {
          msg: "Usuario verificado",
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error at ValidateCode",
        },
      };
    }
  };

  static LoginService = async (
    email: string,
    password: string,
    ipAgent: string,
    userAgent: string,
    browserId: string
  ) => {
    try {
      const { error } = this.SchemaLogin.validate({ email, password });
      if (error) {
        return {
          success: false,
          code: 400,
          error: {
            msg: ErrorMessages(error.details[0].message),
          },
        };
      }

      const pipeline = [
        {
          $match: {
            email: email, // Busca en el campo principal 'email'
          },
        },
        {
          $limit: 1,
        },
        {
          $project: {
            _id: 0,
            email: 1,
            document: 1,
            password: 1,
            uid: 1,
            name: 1,
            typeID: 1,
            planID: 1,
            premiun: 1,
            active_account: 1,
            metadata: 1,
            ultimate_session: 1,
          },
        },
      ];
      let entity;
      let result;

      let user: UserDocument[] = await User.aggregate(pipeline);
      entity = "User";
      if (!user || user.length == 0) {
        user = await Company.aggregate(pipeline);
        entity = "Company";
        if (!user || user.length == 0) {
          result = await this.searchSubUser(email);
          user = result as UserDocument[];
          entity = "SubUser";
          // Verifica si el resultado no es undefined y tiene al menos un elemento // tenemos que trabajar aqui /////////////////////////////////////////////////
          if (!user || user.length == 0) {
            // Accede al primer elemento

            return {
              success: false,
              code: 401,
              error: {
                msg: "Usuario no encontrado",
              },
            };
          }
        }
      }

      if (entity === "SubUser" && result && result.length > 0) {
        const hashPassword = await bcrypt.compare(
          password,
          result[0].auth_users.password
        );
        if (!result[0].auth_users.active_account) {
          return {
            success: false,
            code: 423,
            error: {
              msg: "La cuenta esta inactiva",
            },
          };
        }
        if (!hashPassword) {
          return {
            success: false,
            code: 401,
            error: {
              msg: "Contraseña incorrecta",
            },
          };
        } else {
          let profileUser = await subUserServices.getProfileSubUser(
            result[0].auth_users.Uid
          );

          // AQUI CONTINUAMOS ///////////////////////////////////////////
          console.log(ipAgent);
          console.log(browserId);
          const dataAccessToken = {
            uid: result[0].auth_users.Uid,
            name: profileUser.data?.[0].name,
            email: result[0].auth_users.email,
            CompanyID: result[0].uid,
            type: entity,
            id: result[0].auth_users._id,
            //  exp: this.ExpirationDate(12),
          };

          const dataRefreshToken = { uid: result[0].auth_users.Uid };

          const sessionData = await this.createSession(
            result[0].auth_users.Uid,
            ipAgent,
            userAgent,
            browserId,
            dataAccessToken,
            dataRefreshToken
          );

          const dataUser = [
            {
              CompanyID: result[0].uid,
              uid: result[0].auth_users.Uid,
              name: profileUser.data?.[0].name,
              email: result[0].auth_users.email,
              document: profileUser.data?.[0].document,
              type: entity,
              typeID: result[0].auth_users.typeID,
              planID: result[0].planID,
              online: true,
              lastSession: result[0].auth_users.ultimate_session,
              premiun: user[0].premiun,
            },
          ];

          await Company.updateOne(
            { "auth_users.Uid": result[0].auth_users.Uid }, // Condición de búsqueda por uid
            {
              $set: {
                "auth_users.$.ultimate_session": new Date(),
                "auth_users.$.online": true,
              },
            }
          );

          return {
            success: true,
            code: 200,
            res: {
              msg: "Correcto",
              accessToken: sessionData.accessToken,
              refreshToken: sessionData.refreshToken,
              accessExpiresIn: sessionData.accessExpiresIn,
              refreshExpiresIn: sessionData.refreshExpiresIn,
              dataUser,
            },
          };
        }
      } else {
        const hashPassword = await bcrypt.compare(password, user[0].password);
        if (!hashPassword) {
          return {
            success: false,
            code: 401,
            error: {
              msg: "Contraseña incorrecta",
            },
          };
        }

        if (user[0].metadata?.profile_complete === false) {
          return {
            success: false,
            code: 409,
            error: {
              msg: "El usuario no ha completado su perfil",
              uid: user[0].uid,
              name: user[0].name,
              entity: entity,
            },
          };
        }

        if (user[0].metadata?.identity_verified === false) {
          return {
            success: false,
            code: 403,
            error: {
              msg: "Usuario no verificado",
              uid: user[0].uid,
              name: user[0].name,
              entity: entity,
            },
          };
        }

        if (user[0].active_account === false) {
          return {
            success: false,
            code: 403,
            error: {
              msg: "La cuenta se encuentra inactiva",
              uid: user[0].uid,
              name: user[0].name,
              entity: entity,
            },
          };
        }

        const dataAccessToken = {
          uid: user[0].uid,
          name: user[0].name,
          email: user[0].email,
          type: entity,
          id: user[0]._id,
          //    exp: this.ExpirationDate(12),
        };

        const dataRefreshToken = { uid: user[0].uid };

        const sessionData = await this.createSession(
          user[0].uid,
          ipAgent,
          userAgent,
          browserId,
          dataAccessToken,
          dataRefreshToken
        );

        const dataUser = [
          {
            uid: user[0].uid,
            name: user[0].name,
            email: user[0].email,
            document: user[0].document,
            type: entity,
            typeID: user[0].typeID,
            planID: user[0].planID,
            online: true,
            lastSession: user[0].ultimate_session,
            premiun: user[0].premiun,
          },
        ];
        if (entity === "Company") {
          await Company.updateOne(
            { uid: user[0].uid }, // Condición de búsqueda por uid
            {
              $set: {
                ultimate_session: new Date(),
                online: true,
              },
            }
          );
        } else {
          await User.updateOne(
            { uid: user[0].uid }, // Condición de búsqueda por uid
            {
              $set: {
                ultimate_session: new Date(),
                online: true,
              },
            }
          );
        }

        return {
          success: true,
          code: 200,
          res: {
            msg: "Sesión iniciada correctamente",
            refreshToken: sessionData.refreshToken,
            accessToken: sessionData.accessToken,
            accessExpiresIn: sessionData.accessExpiresIn,
            refreshExpiresIn: sessionData.refreshExpiresIn,
            dataUser,
          },
        };
      }
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error at Login",
        },
      };
    }
  };

  static createSession = async (
    userId: string,
    ipAgent: string,
    userAgent: string,
    browserId: string,
    dataAccessToken: any,
    dataRefreshToken: any
  ) => {
    try {
      let accessExpiresIn;
      let refreshExpiresIn;
      let accessToken: any, refreshToken: any;
      const sessionData = await SessionModel.findOne({
        userId,
        browserId,
      });

      if (!sessionData) {
        accessToken = jwt.sign(dataAccessToken, JWT_SECRET, {
          expiresIn: accessTokenExpiresIn,
        });

        refreshToken = jwt.sign(dataRefreshToken, JWT_REFRESH_SECRET, {
          expiresIn: refreshTokenExpiresIn,
        });
        // Crear una nueva sesión si no existe
        const newSession = await SessionModel.create({
          userId,
          ipAgent,
          userAgent,
          browserId,
          accessToken,
          refreshToken,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        let stateRefreshToken, stateAccessToken;
        stateRefreshToken = verifyRefreshAccessToken(sessionData?.refreshToken);
        stateAccessToken = await verifyToken(sessionData.accessToken);
        if (stateRefreshToken) {
          if (stateAccessToken) {
            accessToken = sessionData.accessToken;
            refreshToken = sessionData.refreshToken;
          } else {
            accessToken = await generateRefreshAccessToken(
              sessionData.accessToken,
              sessionData.refreshToken
            );
            refreshToken = sessionData.refreshToken;
          }
        } else {
          refreshToken = generateToken(sessionData.refreshToken);
          accessToken = await generateRefreshAccessToken(
            sessionData.accessToken,
            sessionData.refreshToken
          );
        }
        // Actualizar la sesión existente con los nuevos tokens
        const updateSession = await SessionModel.updateOne(
          { userId: sessionData.userId, browserId: sessionData.browserId }, // Filtro
          {
            // Campos a actualizar
            $set: {
              accessToken,
              refreshToken,
              updatedAt: new Date(),
            },
          }
        );
      }
      accessExpiresIn = decodeToken(accessToken);
      refreshExpiresIn = decodeToken(refreshToken);
      return {
        accessToken,
        refreshToken,
        refreshExpiresIn,
        accessExpiresIn,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error at Login",
        },
      };
    }
  };

  static async LogoutService(userID: string, refreshToken: string) {
    try {
      if (!refreshToken || !userID) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "Complete los parámetros requeridos",
          },
        };
      }

      const sessionData = await SessionModel.findOne({
        userId: userID,
        refreshToken,
      });

      if (!sessionData) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se encontro la session",
          },
        };
      }

      const response = await SessionModel.deleteOne({
        userId: sessionData.userId,
        refreshToken: sessionData.refreshToken,
      });
      console.log(response);

      console.log(sessionData);
      /*
      let typeUser, tokenExists, entityModel: Model<any>;
      const userData = await this.getDataBaseUser(userID);

      if (
        userData.data?.[0].auth_users &&
        userData.data?.[0].auth_users.typeEntity === TypeEntity.SUBUSER
      ) {
        typeUser = TypeEntity.SUBUSER;
      } else {
        typeUser = userData.data?.[0].typeEntity;
      }
      // Determinar el modelo y verificar la existencia del token

      switch (typeUser) {
        case TypeEntity.COMPANY:
          entityModel = CompanyModel;
          break;
        case TypeEntity.USER:
          entityModel = UserModel;
          break;
        case TypeEntity.SUBUSER:
          entityModel = CompanyModel; // SubUsuarios están dentro de empresas
          break;
        default:
          return {
            success: false,
            code: 400,
            msg: "Tipo de usuario no reconocido",
          };
      }

      // Buscar el refreshToken en la entidad correcta
      if (typeUser === TypeEntity.SUBUSER) {
        tokenExists = await entityModel.findOne({
          "auth_users.refreshToken": refreshToken,
        });
      } else {
        tokenExists = await entityModel.findOne({ refreshToken: refreshToken });
      }

      if (!tokenExists) {
        return {
          success: false,
          code: 401,
          msg: "Refresh token inválido",
        };
      }

      if (typeUser === TypeEntity.SUBUSER) {
        await CompanyModel.updateOne(
          { "auth_users.refreshToken": refreshToken },
          {
            $unset: {
              "auth_users.$.refreshToken": "",
              "auth_users.$.accessToken": "",
              "auth_users.$.online": false,
            },
          } // Solo borra el refreshToken
        );
      } else {
        await entityModel.updateOne(
          { refreshToken: refreshToken },
          { $unset: { refreshToken: "", accessToken: "", online: false } }
        );
      }*/
      if (response.deletedCount > 0) {
        return {
          success: true,
          code: 200,
          res: {
            msg: "Sesión cerrada correctamente",
          },
        };
      } else {
        return {
          success: false,
          code: 409,
          error: {
            msg: "No se ha podido eliminar de la base",
          },
        };
      }
    } catch (error) {
      console.error("Error en logoutService:", error);
      return {
        success: false,
        code: 500,
        msg: "Error en el servidor m",
      };
    }
  }

  private static searchSubUser = async (email: string) => {
    const pipeline = [
      {
        $match: {
          "auth_users.email": email, // Busca en el campo 'auth_users.email'
        },
      },
      {
        $unwind: "$auth_users", // Descompone el array 'auth_users' para trabajar con elementos individuales
      },
      {
        $match: {
          "auth_users.email": email, // Filtra para asegurar que el email es el correcto
        },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          _id: 0,
          uid: 1,
          "auth_users.Uid": 1,
          "auth_users.email": 1,
          "auth_users.password": 1,
          "auth_users.typeID": 1,
          "auth_users.active_account": 1,
          "auth_users.ultimate_session": 1,
          planID: 1,
          premiun: 1,
        },
      },
    ];
    try {
      let result = await Company.aggregate(pipeline);
      // Transformar el resultado
      return result;
    } catch (error) {
      console.error("Error al buscar el subUsuario:", error);
    }
  };
  static NewPasswordService = async (
    email: string,
    password: string,
    entityID: string
  ) => {
    try {
      const userData = await this.getDataBaseUser(entityID);

      let user: any = await User.findOne({ email });
      let typeEntity = TypeEntity.USER;

      if (!user) {
        user = await Company.findOne({ email });
        typeEntity = TypeEntity.COMPANY;
        if (!user) {
          user = await CompanyModel.findOne(
            { uid: userData.data?.[0].uid, "auth_users.email": email }, // Filtra por uid y email dentro de auth_users
            { auth_users: { $elemMatch: { email: email } }, uid: 1, _id: 0 }
          ).lean();

          if (user?.auth_users[0]) {
            typeEntity = TypeEntity.SUBUSER;

            if (userData.data?.[0].auth_users) {
              return {
                success: false,
                code: 404,
                error: {
                  msg: "Debes contactar al Administrador de tu Empresa para cambiar tu Contraseña",
                },
              };
            }
          } else {
            return {
              success: false,
              code: 404,
              error: {
                msg: "Usuario no encontrado",
              },
            };
          }
        }
      }

      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(password, salt);

      const updateQuery = {
        $unset: {
          "metadata.code": 1,
          "metadata.repassword": 1,
          "metadata.expireIn": 1,
        },
        $set: { password: newPassword },
      };

      if (typeEntity === TypeEntity.COMPANY) {
        await Company.findOneAndUpdate({ email }, updateQuery);
      } else if (typeEntity === TypeEntity.USER) {
        await User.findOneAndUpdate({ email }, updateQuery);
      } else {
        console.log("voy a cambiar");
        await CompanyModel.updateOne(
          { uid: entityID, "auth_users.email": email }, // Filtra por email dentro del array
          { $set: { "auth_users.$.password": newPassword } } // Actualiza solo el password del usuario encontrado
        );
      }

      return {
        success: true,
        code: 200,
        res: {
          msg: "Contraseña reestablecida",
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error at NewPassword",
        },
      };
    }
  };

  static SendCodeRecovery = async (email: string) => {
    try {
      const userPipeline = [
        { $match: { email: email } },
        { $limit: 1 },
        { $project: { _id: 1, email: 1, metadata: 1, uid: 1 } },
      ];

      let user = await User.aggregate(userPipeline);
      let userType = UserType.User;
      if (!user || user.length === 0) {
        user = await Company.aggregate(userPipeline);

        userType = UserType.Company;
        if (!user || user.length === 0) {
          const userPipeline = [
            { $unwind: "$auth_users" }, // Desestructura el array
            { $match: { "auth_users.email": email } }, // Filtra por email dentro del array
            {
              $project: {
                _id: 1,
                email: "$auth_users.email",
                metadata: 1,
                uid: 1,
              },
            },
            { $limit: 1 },
          ];
          user = await Company.aggregate(userPipeline);

          if (user.length > 0) {
            return {
              success: false,
              code: 410,
              error: {
                msg: "Debes contactar al usuario de la cuenta principal para recuperar tu contraseña",
              },
            };
          }
        }
      }

      if (!user || user.length === 0) {
        return {
          success: false,
          code: 404,
          error: { msg: "Usuario no encontrado" },
        };
      }

      const userMetadata = user[0].metadata;

      const now = getNow();
      const expireIn = expireInEspecificMinutes(1);

      if (
        userMetadata?.expireIn &&
        new Date(now) < new Date(userMetadata.expireIn)
      ) {
        return {
          success: false,
          code: 409,
          error: {
            msg: `Genera nuevamente ${moment(
              user[0].metadata?.expireIn
            ).fromNow()}`,
          },
        };
      }

      const code = this.VerificationNumber();
      const salt = await bcrypt.genSalt(10);
      const hashCode = await bcrypt.hash(code, salt);

      const update = {
        "metadata.code": hashCode,
        "metadata.expireIn": expireIn,
      };

      const updateResult =
        userType === UserType.Company
          ? await Company.findOneAndUpdate({ email }, update)
          : await User.findOneAndUpdate({ email }, update);

      if (updateResult) {
        sendEmailRecovery(email, code);
        return {
          success: true,
          code: 200,
          res: {
            msg: "Código de verificación enviado por correo",
          },
        };
      } else {
        return {
          success: false,
          code: 500,
          res: {
            msg: "Error al enviar el código de verficación",
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error en el proceso de recuperación",
        },
      };
    }
  };

  static RecoveryPassword = async (
    email: string,
    code: string,
    password: string
  ) => {
    try {
      const iniUserPipeline = [
        {
          $match: {
            email: email,
          },
        },
        {
          $limit: 1,
        },
      ];

      let user = await User.aggregate(iniUserPipeline);
      let userType = UserType.User;

      if (!user || user.length == 0) {
        user = await Company.aggregate(iniUserPipeline);
        userType = UserType.Company;

        if (!user || user.length == 0) {
          return {
            success: false,
            code: 404,
            error: {
              msg: "Usuario no encontrado",
            },
          };
        }
      }

      if (!user[0].metadata?.code) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "Este usuario no tiene código de recuperación",
          },
        };
      }

      const now = getNow();
      if (new Date(now) > new Date(user[0].metadata.expireIn)) {
        return {
          success: false,
          code: 410,
          error: {
            msg: "El código ha expirado, vuelve a generar otro",
          },
        };
      }
      const hashCode = await bcrypt.compare(code, user[0].metadata.code);
      if (!hashCode) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "El código es incorrecto",
          },
        };
      }

      const salt = await bcrypt.genSalt(10);
      const newPassword = await bcrypt.hash(password, salt);

      let update = {
        $unset: {
          "metadata.code": 1,
          "metadata.expireIn": 1,
        },
        $set: { password: newPassword },
      };

      if (userType == 0) {
        await Company.findOneAndUpdate({ email }, update);
      } else {
        await User.findOneAndUpdate({ email }, update);
      }

      return {
        success: true,
        code: 200,
        res: {
          msg: "Contraseña reestablecida",
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al intentar reestablecer la contraseña",
        },
      };
    }
  };

  static getEntityService = async (uid: string) => {
    try {
      let typeEntity;
      let EntityData;

      const pipeline = [
        {
          $match: { uid }, // Filtrar por UID
        },
        {
          $lookup: {
            from: "resourcecounters",
            localField: "uid",
            foreignField: "uid",
            as: "resourceData",
          },
        },
        {
          $unwind: { path: "$resourceData", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            numProducts: { $ifNull: ["$resourceData.numProducts", 0] },
            numServices: { $ifNull: ["$resourceData.numServices", 0] },
            numLiquidations: { $ifNull: ["$resourceData.numLiquidations", 0] },
            numOffersProducts: {
              $ifNull: ["$resourceData.numOffersProducts", 0],
            },
            numOffersServices: {
              $ifNull: ["$resourceData.numOffersServices", 0],
            },
            numOffersLiquidations: {
              $ifNull: ["$resourceData.numOffersLiquidations", 0],
            },
            numPurchaseOrdersProvider: {
              $ifNull: ["$resourceData.numPurchaseOrdersProvider", 0],
            },
            numPurchaseOrdersClient: {
              $ifNull: ["$resourceData.numPurchaseOrdersClient", 0],
            },
            numSellingOrdersProvider: {
              $ifNull: ["$resourceData.numSellingOrdersProvider", 0],
            },
            numSellingOrdersClient: {
              $ifNull: ["$resourceData.numSellingOrdersClient", 0],
            },
            numSubUsers: { $ifNull: ["$resourceData.numSubUsers", 0] },
            numSentApprovedCertifications: {
              $ifNull: ["$resourceData.numSentApprovedCertifications", 0],
            },
            numReceivedApprovedCertifications: {
              $ifNull: ["$resourceData.numReceivedApprovedCertifications", 0],
            },
            numDeleteProducts: {
              $ifNull: ["$resourceData.numDeleteProducts", 0],
            },
            numDeleteServices: {
              $ifNull: ["$resourceData.numDeleteServices", 0],
            },
            numDeleteLiquidations: {
              $ifNull: ["$resourceData.numDeleteLiquidations", 0],
            },
            numDeleteOffersProducts: {
              $ifNull: ["$resourceData.numDeleteOffersProducts", 0],
            },
            numDeleteOffersServices: {
              $ifNull: ["$resourceData.numDeleteOffersServices", 0],
            },
            numDeleteOffersLiquidations: {
              $ifNull: ["$resourceData.numDeleteOffersLiquidations", 0],
            },
            // Asegurar que estos campos siempre existan con valor 0 si son null
            customerCount: { $ifNull: ["$customerCount", 0] },
            customerScore: { $ifNull: ["$customerScore", 0] },
            sellerCount: { $ifNull: ["$sellerCount", 0] },
            sellerScore: { $ifNull: ["$sellerScore", 0] }, // Agregando sellerScore
            categories: { $ifNull: ["$categories", []] },
          },
        },
        {
          $project: {
            resourceData: 0, // Elimina el objeto anidado
            password: 0,
          },
        },
      ];
      let entityData = await Company.aggregate(pipeline);
      typeEntity = "Company";
      if (entityData.length === 0) {
        entityData = await User.aggregate(pipeline);
        typeEntity = "User";
        if (entityData.length === 0) {
          return {
            success: false,
            code: 401,
            error: {
              msg: "No se encontró el usuario con el uid proporcionado",
            },
          };
        }
      }
      entityData = {
        ...entityData[0],
        typeEntity,
      };

      return {
        success: true,
        code: 200,
        data: entityData,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error con el servidor",
        },
      };
    }
  };

  static getDataBaseUser = async (uid: string) => {
    try {
      let Entitydata: any = await this.getEntityService(uid);
      if ((await Entitydata).success === false) {
        Entitydata = await this.getAuthSubUser(uid);

        if ((await Entitydata).success === false) {
          return {
            success: false,
            code: 403,
            error: {
              msg: "Usuario no Encontrado",
            },
          };
        }
      }

      const entityData = await Entitydata;
      let data = new Array();
      let scores, customerCount, customerScore, sellerCount, sellerScore;

      switch (entityData.data.typeEntity) {
        case "Company":
          scores = await ScoreService.getScoreCount(entityData.data.uid);
          customerCount = scores.data?.customerCount ?? 0;
          customerScore = scores.data?.customerScore ?? 0;
          sellerCount = scores.data?.sellerCount ?? 0;
          sellerScore = scores.data?.sellerScore ?? 0;

          data = [
            {
              uid: entityData.data.uid,
              name: entityData.data.name,
              document: entityData.data.document,
              email: entityData.data.email,
              typeEntity: entityData.data.typeEntity,
              image: entityData.data.avatar,
              tenure: entityData.data.age,
              accessToken: entityData.data.accessToken,
              refreshToken: entityData.data.refreshToken,
              customerCount,
              customerScore,
              sellerCount,
              sellerScore,
              categories: entityData.data.categories,
              planID: entityData.data.planID,
              premiun: entityData.data.premiun,
            },
          ];
          break;

        case "User":
          scores = await ScoreService.getScoreCount(entityData.data.uid);

          customerCount = scores.data?.customerCount ?? 0;
          customerScore = scores.data?.customerScore ?? 0;
          sellerCount = scores.data?.sellerCount ?? 0;
          sellerScore = scores.data?.sellerScore ?? 0;

          data = [
            {
              uid: entityData.data.uid,
              name: entityData.data.name,
              document: entityData.data.document,
              email: entityData.data.email,
              typeEntity: entityData.data.typeEntity,
              image: entityData.data.avatar,
              accessToken: entityData.data.accessToken,
              refreshToken: entityData.data.refreshToken,
              customerCount,
              customerScore,
              sellerCount,
              sellerScore,
              categories: entityData.data.categories,
              planID: entityData.data.planID,
              premiun: entityData.data.premiun,
            },
          ];
          break;

        case "SubUser":
          const dataProfile = await subUserServices.getProfileSubUser(uid);
          let authUsers = entityData.data.auth_users;
          authUsers.name = dataProfile?.data?.[0].name ?? "";
          authUsers.document = dataProfile?.data?.[0].document ?? "";
          authUsers.typeEntity = entityData.data.typeEntity;

          let dataCompany: any = await this.getEntityService(
            entityData.data.uid
          );
          scores = ScoreService.getScoreCount(entityData.data.uid);

          customerCount = (await scores).data?.customerCount;
          customerScore = (await scores).data?.customerScore;
          sellerCount = (await scores).data?.sellerCount;
          sellerScore = (await scores).data?.sellerScore;
          data = [
            {
              uid: entityData.data.uid,
              name: entityData.data.name,
              document: entityData.data.document,
              email: dataCompany.data?.email,
              tenure: dataCompany.data?.age,
              customerCount,
              customerScore,
              sellerCount,
              sellerScore,
              typeEntity: "Company",
              image: entityData.data.avatar,
              auth_users: entityData.data.auth_users,
              categories: dataCompany.data?.categories,
              planID: entityData.data.planID,
              premiun: entityData.data.premiun,
            },
          ];
          break;

        default:
          return {
            success: false,
            code: 403,
            error: {
              msg: "No se encontro el Usuario",
            },
          };
      }

      return {
        success: true,
        code: 200,
        data: data,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error con el servidor" + error,
        },
      };
    }
  };

  static getAuthSubUser = async (uid: string) => {
    const pipeline = [
      {
        $match: {
          "auth_users.Uid": uid, // Filtra solo los documentos donde haya un auth_user con el Uid buscado
        },
      },
      {
        $unwind: "$auth_users", // Desenrolla el array 'auth_users' para que sea un solo objeto
      },
      {
        $match: {
          "auth_users.Uid": uid, // Filtra solo el auth_user que coincida con el Uid buscado
        },
      },
      {
        $project: {
          _id: 0,
          uid: 1,
          name: 1,
          document: 1,
          cityID: 1,
          planID: 1,
          premiun: 1,
          avatar: 1,
          categories: 1,
          "auth_users.email": 1,
          "auth_users.typeID": 1,
          "auth_users.ultimate_session": 1,
          "auth_users.active_account": 1,
          "auth_users.Uid": 1,
          "auth_users.accessToken": 1,
          "auth_users.refreshToken": 1,
        },
      },
    ];

    try {
      let subuser = await Company.aggregate(pipeline);
      if (subuser.length === 0) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "No se encontró el usuario con el uid proporcionado",
          },
        };
      }
      let typeEntity = "SubUser";
      subuser = {
        ...subuser[0],
        typeEntity,
      };
      return {
        success: true,
        code: 200,
        data: subuser,
        typeEntity: "SubUser",
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Hubo un error interno con el Servidor",
        },
      };
    }
  };

  static updateCompany = async (data: CompanyI) => {
    let {
      uid,
      phone,
      address,
      countryID,
      cityID,
      age,
      specialtyID,
      about_me,
      categories,
    } = data;

    about_me = about_me ?? "";
    // Validar los datos
    const SchemaCompany = this.SchemaProfileCompany.fork(
      ["countryID"],
      (field) => field.optional()
    );
    const { error } = SchemaCompany.validate(data);
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
    const profileCompany = await Company.findOne({ uid });
    if (!profileCompany) {
      return {
        success: false,
        code: 409,
        error: {
          msg: "No existe el perfil",
        },
      };
    }

    // Actualizar el perfil
    try {
      const updatedProfileCompany = await Company.findOneAndUpdate(
        { uid }, // Criterio de búsqueda
        {
          $set: {
            phone,
            address,
            countryID,
            cityID,
            age,
            specialtyID,
            about_me,
            categories,
          },
        }, // Campos a actualizar
        { new: true, runValidators: true } // Devuelve el documento actualizado y ejecuta validaciones
      );

      if (!updatedProfileCompany) {
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
          msg: "Perfil actualizado correctamente",
        },
      };
    } catch (error) {
      console.error("Error actualizando el perfil:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al actualizar el perfil",
        },
      };
    }
  };

  static UpdateUser = async (data: UserI) => {
    const { uid, cityID, address, phone } = data;

    // Validar los datos
    const SchemaUser = this.SchemaProfileUser.fork(["countryID"], (field) =>
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
    const profileUser = await User.findOne({ uid });
    if (!profileUser) {
      return {
        success: false,
        code: 409,
        error: {
          msg: "No existe el perfil de usuario",
        },
      };
    }

    // Actualizar el perfil del usuario
    try {
      const updatedProfileUser = await User.findOneAndUpdate(
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

      if (!updatedProfileUser) {
        return {
          success: false,
          code: 500,
          error: {
            msg: "Error al actualizar el perfil del usuario",
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
      console.error("Error actualizando el perfil del usuario:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al actualizar el perfil del usuario",
        },
      };
    }
  };

  static getSearchCompany = async (text: string) => {
    try {
      //getSearchCompany
      // Función para normalizar texto
      const normalizeText = (textQuery: string) =>
        textQuery
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, ""); // Elimina tildes y diacríticos

      // Normaliza la consulta
      const normalizedQuery = normalizeText(text);

      // Consulta inicial más amplia en MongoDB (menos estricta)
      const resultData = await CompanyModel.find(
        {},
        { uid: 1, name: 1, document: 1, image: "$avatar", _id: 0 }
      ).limit(20);

      if (resultData.length === 0) {
        // Si no se encuentran coincidencias con MongoDB, devuelve vacío
        return {
          success: true,
          code: 200,
          data: [],
        };
      }

      // Normalizar los datos para Fuse.js
      const normalizedCompanies = resultData.map((company) => ({
        ...company.toObject(),
        name: normalizeText(company.name),
      }));

      // Configuración de Fuse.js
      const fuseOptions = {
        keys: ["name"], // Campo a buscar
        threshold: 0.3, // Más estricto pero permite errores tipográficos menores
      };
      const fuse = new Fuse(normalizedCompanies, fuseOptions);

      // Aplicar Fuse.js para buscar coincidencias
      const results = fuse.search(normalizedQuery);

      // Mapear resultados relevantes
      const matchedCompanies = results.map((result) => result.item);

      await sendEmailCategories();
      return {
        success: true,
        code: 200,
        data: matchedCompanies,
      };
    } catch (error) {
      console.error("Error buscando empresas:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al buscar empresas",
        },
      };
    }
  };

  static getUsers = async () => {
    try {
      const companies = await CompanyModel.aggregate([
        {
          $match: {
            "metadata.identity_verified": true,
            "metadata.profile_complete": true,
            active_account: true,
            $or: [
              { auth_users: { $exists: false } },
              { auth_users: { $size: 0 } },
              { auth_users: { $elemMatch: { active_account: true } } },
            ],
          },
        },
        {
          $project: {
            _id: 0,
            uid: 1,
            name: 1,
            email: 1,
            categories: 1,
            metadata: 1,
            auth_users: {
              $cond: {
                if: { $gt: [{ $size: { $ifNull: ["$auth_users", []] } }, 0] },
                then: {
                  $filter: {
                    input: "$auth_users",
                    as: "user",
                    cond: { $eq: ["$$user.active_account", true] },
                  },
                },
                else: [],
              },
            },
          },
        },
      ]);

      // traer los SubUsuarios con sus Emails
      const users = await UserModel.find(
        {
          "metadata.identity_verified": true,
          "metadata.profile_complete": true,
          active_account: true,
        },
        {
          uid: 1,
          name: 1,
          email: 1,
          categories: 1,
          _id: 0, // opcional: oculta el campo _id
        }
      );

      return {
        success: true,
        code: 200,
        users,
        companies,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al buscar usuarios",
        },
      };
    }
  };
}
