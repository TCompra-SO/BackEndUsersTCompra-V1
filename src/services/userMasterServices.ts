import bcrypt from "bcrypt";
import { UserMasterI } from "../interfaces/userMaster.interface";
import { UserMasterModel } from "../models/userMasterModel";
import { TypeEntity } from "../types/globalTypes";

export class UserMasterService {
  /**
   * Crea un usuario con rol MASTER
   * @param username Nombre de usuario
   * @param email Correo electrónico
   * @param password Contraseña en texto plano
   * @returns Usuario creado
   */
  static createMasterUser = async (
    username: string,
    email: string,
    password: string
  ) => {
    // Validar si ya existe un usuario MASTER
    const existingMaster = await UserMasterModel.findOne({
      role: TypeEntity.MASTER,
    });
    if (existingMaster) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "El usuario Master ya existe",
        },
      };
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario MASTER
    const masterUser = new UserMasterModel({
      username,
      email,
      password: hashedPassword,
      role: TypeEntity.MASTER,
    });
    await masterUser.save();
    return {
      success: true,
      code: 200,
      res: {
        msg: "Usuario Master creado con éxito",
      },
    };
  };
}
