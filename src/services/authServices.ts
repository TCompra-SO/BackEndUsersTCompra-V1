import moment from "moment";
import "moment/locale/es"; // Importa el idioma español
moment.locale("es"); // Establece el idioma a español
import Joi, { string } from "joi";
import User from "../models/userModel";
import Company from "../models/companyModel";

import { encrypt, verified } from "../utils/bcrypt.handle";
import { generateToken } from "../utils/jwt.handle";
import { ErrorMessages } from "../utils/ErrorMessages";
import axios, { AxiosRequestConfig } from "axios";
import { MetadataI } from "../interfaces/utils.interface";
import { CompanyI } from "../interfaces/company.interface";
import { UserI } from "../interfaces/user.interface";
import { expireInEspecificMinutes, getNow } from "../utils/DateTools";
import bcrypt from "bcrypt";
import { sendEmail, sendEmailRecovery } from "../utils/NodeMailer";
import jwt from "jsonwebtoken";
import { error } from "console";
import { matchesGlob } from "path";
import { AuthUserI } from "./../interfaces/authUser.interface";
import { getSubUserController } from "../controllers/subUserController";
import { subUserServices } from "./subUserServices";
import { pipeline } from "stream";
import { configDotenv } from "dotenv";
import { ScoreService } from "./scoreServices";

export interface UserDocument extends Document {
  _id: string;
  email: string;
  password: string;
  uid: string;
  name: string;
  metadata?: {
    identity_verified?: boolean;
    profile_complete?: boolean;
  };
  active_account: boolean;
  planID: number;
  typeID: number;
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
    about_me: Joi.string().min(3).max(500),
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
          return {
            success: false,
            code: 404,
            error: {
              msg: "Usuario no encontrado",
            },
          };
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

  static LoginService = async (email: string, password: string) => {
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
            password: 1,
            uid: 1,
            name: 1,
            typeID: 1,
            planID: 1,
            active_account: 1,
            metadata: 1,
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
          } //////////////////////////////////////// ESTO ESTA PENDIENTE ////////////////////////////////////////////
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

          const token = jwt.sign(
            {
              uid: result[0].auth_users.Uid,
              name: user[0].name,
              email: result[0].auth_users.email,
              id: result[0].auth_users._id,
              exp: this.ExpirationDate(12),
            },
            process.env.JWT_SECRET as string
          );
          // AQUI CONTINUAMOS ///////////////////////////////////////////
          const dataUser = [
            {
              CompanyID: result[0].uid,
              uid: result[0].auth_users.Uid,
              name: profileUser.data?.name,
              email: result[0].auth_users.email,
              type: entity,
              typeID: result[0].auth_users.typeID,
              planID: result[0].planID,
            },
          ];

          await Company.updateOne(
            { "auth_users.Uid": result[0].auth_users.Uid }, // Condición de búsqueda por uid
            { $set: { "auth_users.$.ultimate_session": new Date() } }
          );
          return {
            success: true,
            code: 200,
            res: {
              msg: "Correcto",
              token,
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
              entity: entity,
            },
          };
        }

        const token = jwt.sign(
          {
            uid: user[0].uid,
            name: user[0].name,
            email: user[0].email,
            id: user[0]._id,
            exp: this.ExpirationDate(12),
          },
          process.env.JWT_SECRET as string
        );
        const dataUser = [
          {
            uid: user[0].uid,
            name: user[0].name,
            email: user[0].email,
            type: entity,
            typeID: user[0].typeID,
            planID: user[0].planID,
          },
        ];
        if (entity === "Company") {
          await Company.updateOne(
            { uid: user[0].uid }, // Condición de búsqueda por uid
            { $set: { ultimate_session: new Date() } }
          );
        } else {
          await User.updateOne(
            { uid: user[0].uid }, // Condición de búsqueda por uid
            { $set: { ultimate_session: new Date() } }
          );
        }

        return {
          success: true,
          code: 200,
          res: {
            msg: "Sesión iniciada correctamente",
            token,
            dataUser,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error at Login",
        },
      };
    }
  };
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
          planID: 1,
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
  static NewPasswordService = async (email: string, password: string) => {
    try {
      let user = await User.findOne({ email });
      let isCompany = false;

      if (!user) {
        user = await Company.findOne({ email });
        if (!user) {
          return {
            success: false,
            code: 404,
            error: {
              msg: "Usuario no encontrado",
            },
          };
        }
        isCompany = true;
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

      if (isCompany) {
        await Company.findOneAndUpdate({ email }, updateQuery);
      } else {
        await User.findOneAndUpdate({ email }, updateQuery);
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

      const pipeline = [
        { $match: { uid } }, // Filtra por el uid proporcionado
        {
          $project: {
            password: 0, // Excluye el campo 'password'
            __v: 0,
            _id: 0,
            createdAt: 0,
            updatedAt: 0,
            auth_users: 0,
          },
        },
      ];
      let entity = await Company.aggregate(pipeline);
      typeEntity = "Company";
      if (entity.length === 0) {
        entity = await User.aggregate(pipeline);
        typeEntity = "User";
        if (entity.length === 0) {
          return {
            success: false,
            code: 401,
            error: {
              msg: "No se encontró el usuario con el uid proporcionado",
            },
          };
        }
      }

      return {
        success: true,
        code: 200,
        data: entity,
        typeEntity: typeEntity,
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
      let Entitydata = this.getEntityService(uid);
      if ((await Entitydata).success === false) {
        Entitydata = this.getAuthSubUser(uid);
        if ((await Entitydata).success === false) {
          return {
            success: false,
            code: 401,
            error: {
              msg: "Usuario no Encontrado",
            },
          };
        }
      }
      const entityData = await Entitydata;
      let data = new Array();
      let scores, customerCount, customerScore, sellerCount, sellerScore;
      switch (entityData.typeEntity) {
        case "Company":
          scores = ScoreService.getScoreCount(entityData.data[0].uid);
          customerCount = (await scores).data?.customerCount;
          customerScore = (await scores).data?.customerScore;
          sellerCount = (await scores).data?.sellerCount;
          sellerScore = (await scores).data?.sellerScore;
          data = [
            {
              uid: entityData.data[0].uid,
              name: entityData.data[0].name,
              email: entityData.data[0].email,
              typeEntity: entityData.typeEntity,
              image: entityData.data[0].avatar,
              tenure: entityData.data[0].age,
              customerCount,
              customerScore,
              sellerCount,
              sellerScore,
            },
          ];
          break;

        case "User":
          // aqui corregir

          scores = ScoreService.getScoreCount(entityData.data[0].uid);

          customerCount = (await scores).data?.customerCount;
          customerScore = (await scores).data?.customerScore;
          sellerCount = (await scores).data?.sellerCount;
          sellerScore = (await scores).data?.sellerScore;
          data = [
            {
              uid: entityData.data[0].uid,
              name: entityData.data[0].name,
              email: entityData.data[0].email,
              typeEntity: entityData.typeEntity,
              image: entityData.data[0].avatar,
              customerCount,
              customerScore,
              sellerCount,
              sellerScore,
            },
          ];
          break;

        case "SubUser":
          const dataProfile = await subUserServices.getProfileSubUser(uid);
          let authUsers = entityData.data[0].auth_users;
          authUsers.name = dataProfile?.data?.name ?? "";
          authUsers.typeEntity = entityData.typeEntity;

          let dataCompany = this.getEntityService(entityData.data[0].uid);
          scores = ScoreService.getScoreCount(entityData.data[0].uid);

          customerCount = (await scores).data?.customerCount;
          customerScore = (await scores).data?.customerScore;
          sellerCount = (await scores).data?.sellerCount;
          sellerScore = (await scores).data?.sellerScore;
          data = [
            {
              uid: entityData.data[0].uid,
              name: entityData.data[0].name,
              email: (await dataCompany).data?.[0].email,
              tenure: (await dataCompany).data?.[0].age,
              customerCount,
              customerScore,
              sellerCount,
              sellerScore,
              typeEntity: "Company",
              image: entityData.data[0].avatar,
              auth_users: entityData.data[0].auth_users,
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
          break;
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
          avatar: 1,
          "auth_users.email": 1,
          "auth_users.typeID": 1,
          "auth_users.ultimate_session": 1,
          "auth_users.active_account": 1,
          "auth_users.Uid": 1,
        },
      },
    ];

    try {
      const subuser = await Company.aggregate(pipeline);
      if (subuser.length === 0) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "No se encontró el usuario con el uid proporcionado",
          },
        };
      }
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
    } = data;

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
}
