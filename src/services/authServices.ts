import moment from "moment";
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
    country: Joi.string().min(1).max(50).required(),
    city: Joi.string().min(1).max(50).required(),
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
    country: Joi.string().min(1).max(50).required(),
    city: Joi.string().min(1).max(50).required(),
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
      const emailToVerifyPipeline = [
        {
          $match: {
            email: email,
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

      if (dni) {
        const emailToverify = await User.aggregate(emailToVerifyPipeline);
        if (emailToverify.length == 0) {
          const docToVerify = await User.aggregate(docToVerifyPipeline);
          if (docToVerify.length > 0) {
            return {
              success: false,
              code: 403,
              error: {
                msg: "Documento ya registrado",
              },
            };
          }
        } else {
          return {
            success: false,
            code: 409,
            error: {
              msg: "Email ya registrado",
            },
          };
        }
      }

      if (ruc) {
        const emailToverify = await Company.aggregate(emailToVerifyPipeline);
        if (emailToverify.length == 0) {
          const docToVerify = await Company.aggregate(docToVerifyPipeline);
          if (docToVerify.length > 0) {
            return {
              success: false,
              code: 403,
              error: {
                msg: "Documento ya registrado",
              },
            };
          }
        } else {
          return {
            success: false,
            code: 409,
            error: {
              msg: "Email ya registrado",
            },
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

      // Supongamos que `getNameReniec` devuelve un string
      const responseName = await this.getNameReniec(dni, ruc);
      let fullName = "";

      if (responseName.success) {
        fullName = responseName.data || "";

        const metadata: MetadataI = { identity_verified: false };
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
      country,
      city,
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

    // Actualizar el perfil
    try {
      const updatedProfileCompany = await Company.findOneAndUpdate(
        { uid }, // Criterio de búsqueda
        {
          $set: {
            phone,
            address,
            country,
            city,
            age,
            specialtyID,
            about_me,
            categories,
            planID,
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
    const { uid, phone, address, country, city, categories, planID } = data;

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

    // Actualizar el perfil
    try {
      const updatedProfileUser = await User.findOneAndUpdate(
        { uid }, // Criterio de búsqueda
        {
          $set: {
            phone,
            address,
            country,
            city,
            categories,
            planID,
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
      // encriptamos cidigo
      const salt = await bcrypt.genSalt(10);
      const hashCode = await bcrypt.hash(code, salt);

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

      interface UserDocument extends Document {
        _id: string;
        email: string;
        password: string;
        uid: string;
        name: string;
        metadata?: {
          userType: string;
        };
      }

      const pipeline = [
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
            password: 1,
            uid: 1,
            name: 1,
            metadata: 1,
          },
        },
      ];

      let user: UserDocument[] = await User.aggregate(pipeline);

      if (!user || user.length == 0) {
        user = await Company.aggregate(pipeline);

        if (!user || user.length == 0) {
          return {
            success: false,
            code: 401,
            error: {
              msg: "Usuario no encontrado",
            },
          };
        }
      }

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

      const token = jwt.sign(
        {
          uid: user[0].uid,
          name: user[0].name,
          email: user[0].email,
          id: user[0]._id,
          type: user[0].metadata?.userType,
          exp: this.ExpirationDate(12),
        },
        process.env.JWT_SECRET as string
      );
      return {
        success: true,
        code: 200,
        res: {
          msg: "Sesión iniciada correctamente",
          token,
          type: user[0].metadata?.userType,
        },
      };
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
          },
        },
      ];

      let user = await User.aggregate(userPipeline);
      let userType = UserType.User;

      if (!user || user.length == 0) {
        user = await Company.aggregate(userPipeline);
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

        const now = getNow();
        const expireIn = expireInEspecificMinutes(1);

        const code = this.VerificationNumber();
        const salt = await bcrypt.genSalt(10);
        const hashCode = await bcrypt.hash(code, salt);

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

        sendEmailRecovery(email, code);
        if (userType == UserType.Company) {
          ////////////ver
        }
      }
    } catch (error) {}
  };
}
