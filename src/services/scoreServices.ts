import { configDotenv } from "dotenv";
import CompanyModel from "../models/companyModel";
import UserModel from "../models/userModel";
import { AuthServices } from "./authServices";
import { error } from "console";
import { ScoreI } from "../interfaces/score.interface";
import { array } from "joi";

export class ScoreService {
  static registerScore = async (
    typeScore: string,
    uidEntity: string,
    uidUser: string,
    score: number,
    comments: string
  ) => {
    try {
      console.log(comments);
      const data = await AuthServices.getDataBaseUser(uidUser);
      if (data.success === false) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Usuario no encontrado",
          },
        };
      }
      const entityData = await AuthServices.getDataBaseUser(uidEntity);

      if (
        uidEntity === uidUser ||
        entityData.data?.[0].uid === data.data?.[0].uid
      ) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "El usuario no puede calificarse, por pertenecer a la mista entidad",
          },
        };
      }

      if (entityData.success === false) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Entidad no encontrada",
          },
        };
      }

      const userdata = data.data?.[0];
      let entity;

      if (entityData.data?.[0].typeEntity === "Company") {
        entity = await CompanyModel.findOne({ uid: entityData.data?.[0].uid });

        if (!entity) {
          return {
            success: false,
            code: 403,
            error: {
              msg: "Compañía no encontrada",
            },
          };
        }
        const dataUserScore = this.getUserScoreEntity(
          uidEntity,
          userdata.uid,
          typeScore,
          entityData.data?.[0].typeEntity
        );
        const newScore = {
          uid: userdata.uid,
          score,
          comments,
        };

        if ((await dataUserScore).success === false) {
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
              msg: "Calificación agregada exitosamente",
            },
          };
        } else {
          let filter = {};
          let update = {};
          switch (typeScore) {
            case "Client":
              filter = {
                uid: uidEntity,
                ["score_client.uid"]: userdata.uid,
              };

              update = {
                $set: {
                  ["score_client.$.score"]: score,
                  ["score_client.$.comments"]: comments,
                },
              };
              break;
            case "Provider":
              filter = {
                uid: uidEntity,
                ["score_provider.uid"]: userdata.uid,
              };

              update = {
                $set: {
                  ["score_provider.$.score"]: score,
                  ["score_provider.$.comments"]: comments,
                },
              };

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

          const updatedEntity = await CompanyModel.findOneAndUpdate(
            filter,
            update,
            { new: true }
          );

          if (!updatedEntity) {
            return {
              success: false,
              code: 403,
              error: {
                msg: "No se pudo actualizar la calificación",
              },
            };
          }

          return {
            success: true,
            code: 200,
            res: {
              msg: "se ha actualizado la calificación exitosamente",
            },
          };
        }
      } else {
        let entity = await UserModel.findOne({ uid: uidEntity });
        if (!entity) {
          return {
            success: false,
            code: 403,
            error: {
              msg: "Usuario no encontrado",
            },
          };
        }

        const dataUserScore = this.getUserScoreEntity(
          uidEntity,
          userdata.uid,
          typeScore,
          entityData.data?.[0].typeEntity
        );
        const newScore = {
          uid: userdata.uid,
          score,
          comments,
        };
        if ((await dataUserScore).success === false) {
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
          let filter = {};
          let update = {};
          switch (typeScore) {
            case "Client":
              filter = {
                uid: uidEntity,
                ["score_client.uid"]: userdata.uid,
              };

              update = {
                $set: {
                  ["score_client.$.score"]: score,
                  ["score_client.$.comments"]: comments,
                },
              };
              break;
            case "Provider":
              filter = {
                uid: uidEntity,
                ["score_provider.uid"]: userdata.uid,
              };

              update = {
                $set: {
                  ["score_provider.$.score"]: score,
                  ["score_provider.$.comments"]: comments,
                },
              };

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

          const updatedEntity = await UserModel.findOneAndUpdate(
            filter,
            update,
            { new: true }
          );

          if (!updatedEntity) {
            return {
              success: false,
              code: 403,
              error: {
                msg: "No se pudo actualizar la calificación",
              },
            };
          }

          return {
            success: true,
            code: 200,
            res: {
              msg: "se ha actualizado la calificación exitosamente",
            },
          };
        }
      }
    } catch (error) {
      console.error(error);
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

      if (data.data?.score_client && data.data?.score_client.length > 0) {
        customerCount = data.data?.score_client.length;
        customerScore = sumScores(data.data?.score_client) / customerCount;
      }
      if (data.data?.score_provider && data.data?.score_provider.length) {
        sellerCount = data.data?.score_provider.length;
        sellerScore = sumScores(data.data?.score_provider) / sellerCount;
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

  static getUserScoreEntity = async (
    uid: string,
    uidEntity: string,
    typeScore: string,
    typeEntity: string
  ) => {
    let pipeline = [];
    try {
      if (typeScore === "Client") {
        pipeline.push(
          {
            $match: {
              // Filtro por el uid principal
              uid: uid,
              // Filtro por score_client.uid dentro del array
              "score_client.uid": uidEntity,
            },
          },
          {
            $project: {
              // Seleccionamos los campos que queremos ver
              document: 1,
              name: 1,
              email: 1,
              score_client: {
                $filter: {
                  input: "$score_client",
                  as: "score",
                  cond: { $eq: ["$$score.uid", uidEntity] },
                },
              },
            },
          }
        );
      } else {
        pipeline.push(
          {
            $match: {
              // Filtro por el uid principal
              uid: uid,
              // Filtro por score_client.uid dentro del array
              "score_provider.uid": uidEntity,
            },
          },
          {
            $project: {
              // Seleccionamos los campos que queremos ver
              document: 1,
              name: 1,
              email: 1,
              score_client: {
                $filter: {
                  input: "$score_provider",
                  as: "score",
                  cond: { $eq: ["$$score.uid", uidEntity] },
                },
              },
            },
          }
        );
      }
      let result;

      if (typeEntity === "User") {
        result = await UserModel.aggregate(pipeline);
      } else {
        result = await CompanyModel.aggregate(pipeline);
      }

      if (result.length < 1) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "El Usuario aun no te ha calificado",
          },
        };
      }
      return {
        success: true,
        code: 200,
        data: result,
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
