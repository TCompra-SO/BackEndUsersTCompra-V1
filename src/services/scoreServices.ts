import { configDotenv } from "dotenv";
import CompanyModel from "../models/companyModel";
import UserModel from "../models/userModel";
import { AuthServices } from "./authServices";
import { error } from "console";
import { ScoreI } from "../interfaces/score.interface";

export class ScoreService {
  static registerScore = async (
    typeScore: string,
    uidEntity: string,
    uidUser: string,
    score: number,
    comments: string
  ) => {
    if (uidEntity === uidUser) {
      return {
        success: false,
        code: 401,
        error: {
          msg: "El usuario no puede calificarse por pertenecer a la mista entidad",
        },
      };
    }
    try {
      const data = await AuthServices.getDataBaseUser(uidEntity);
      if (data.success === false) {
        console.log(data.error);
        return {
          success: false,
          code: 403,
          error: {
            msg: "Usuario no encontrado +" + data.error,
          },
        };
      }
      const userdata = data.data?.[0];
      let entity;
      if (userdata.typeEntity === "Company") {
        if (userdata.uid) {
          entity = await CompanyModel.findOne({ uid: userdata.uid });
        } else {
          entity = await CompanyModel.findOne(userdata.idCompany);
        }

        if (!entity) {
          return {
            success: false,
            code: 403,
            error: {
              msg: "Compañía no encontrada",
            },
          };
        }

        const newScore = {
          uid: uidUser,
          score,
          comments,
        };

        switch (typeScore) {
          case "Client":
            entity.score_client.push(newScore);
            break;
          case "Provider":
            entity.score_provider.push(newScore);
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
        await entity.save();
        return {
          success: true,
          code: 200,
          res: {
            msg: "Puntaje agregado exitosamente",
          },
        };
      } else {
        let entity = await UserModel.findOne({ uid: uidEntity });
        console.log(entity);
        if (!entity) {
          return {
            success: false,
            code: 403,
            error: {
              msg: "Usuario no encontrado",
            },
          };
        }
        const newScore = {
          uid: uidUser,
          score,
          comments,
        };
        switch (typeScore) {
          case "Client":
            entity.score_client.push(newScore);
            break;
          case "Provider":
            entity.score_provider.push(newScore);
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

        await entity.save();
        return {
          success: true,
          code: 200,
          res: {
            msg: "Puntaje agregado exitosamente",
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor" + error,
        },
      };
    }
  };

  static getScoreCount = async (uid: string) => {
    let customerCount = 0;
    let sellerCount = 0;
    let customerScore = 0;
    let sellerScore = 0;
    try {
      const data = await AuthServices.getEntityService(uid);

      const sumScores = (scores: ScoreI[]): number => {
        return scores.reduce((accumulator, current) => {
          return accumulator + current.score;
        }, 0);
      };

      if (
        data.data?.[0].score_client &&
        data.data?.[0].score_client.length > 0
      ) {
        customerCount = data.data?.[0].score_client.length;
        customerScore = sumScores(data.data?.[0].score_client) / customerCount;
      }
      if (
        data.data?.[0].score_provider &&
        data.data?.[0].score_provider.length
      ) {
        sellerCount = data.data?.[0].score_provider.length;
        sellerScore = sumScores(data.data?.[0].score_provider) / sellerCount;
      }

      if (!data) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se encontró el usuario",
          },
        };
      }
      return {
        success: true,
        code: 200,
        data: {
          customerCount,
          customerScore,
          sellerCount,
          sellerScore,
        },
      };
    } catch (error) {
      console.log(error);
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
