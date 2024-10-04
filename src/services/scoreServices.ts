import CompanyModel from "../models/companyModel";
import { AuthServices } from "./authServices";
import { error } from "console";

export class ScoreService {
  static registerScore = async (
    typeScore: string,
    uidEntity: string,
    uidUser: string,
    score: number,
    comments: string
  ) => {
    try {
      const data = await AuthServices.getDataBaseUser(uidEntity);
      ////////aqui continuamos
      console.log(data);
      const userdata = data.data?.[0];
      if (userdata.typeEntity === "Company") {
        const company = await CompanyModel.findOne(userdata.idCompany);

        if (!company) {
          return {
            success: false,
            code: 404,
            error: {
              msg: "Compañía no encontrada",
            },
          };
        }

        const newScore = {
          uid: uidUser,
          stars: score,
          comments,
        };
        switch (typeScore) {
          case "Client":
            company.score_client.push(newScore);
            break;
          case "Provider":
            company.score_provider.push(newScore);
            break;
          default:
            return {
              success: false,
              code: 401,
              error: {
                msg: "typeScore invalido",
              },
            };
        }
        await company.save();
        return {
          success: true,
          code: 200,
          res: {
            msg: "Puntaje agregado exitosamente",
          },
        };
      } else {
        console.log("es un User");
      }

      if (!data) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se pudo agregar",
          },
        };
      }
      return {
        success: true,
        code: 200,
        data: userdata,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor",
        },
      };
    }
  };
}
