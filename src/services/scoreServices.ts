import { configDotenv } from "dotenv";
import CompanyModel from "../models/companyModel";
import UserModel from "../models/userModel";
import { AuthServices } from "./authServices";
import { error } from "console";
import { ScoreI } from "../interfaces/score.interface";
import { array } from "joi";
import mongoose, { Mongoose } from "mongoose";
import dbConnect from "../database/mongo";
import ScoreClientModel from "../models/scoreClient";
import ScoreProviderModel from "../models/scoreProvider";
import { CollectionType, TypeScore } from "../types/globalTypes";

export class ScoreService {
  static registerScore = async (
    typeScore: string,
    uidEntity: string,
    uidUser: string,
    score: number,
    comments: string,
    offerID?: string,
    type?: CollectionType
  ) => {
    //CORREGIR EL ESCORE CON LOS NUEVOS MODELO
    try {
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
      //falta el COMPY
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

        const newScore = {
          userId: userdata.uid,
          entityId: uidEntity,
          score,
          comments,
          offerId: offerID,
          type,
        };
        let scoreData;

        switch (typeScore) {
          case "Client":
            // entity.score_client.push(newScore);
            if (offerID && type) {
              const result = await ScoreClientModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: offerID,
              });
              if (result) {
                return {
                  success: false,
                  code: 407,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }

              scoreData = new ScoreClientModel(newScore);
              let savedScore = await scoreData.save();
              if (savedScore) {
                await CompanyModel.updateOne(
                  { uid: entity.uid },
                  { $inc: { customerCount: 1 } }, // Incrementa en 1 o lo crea con 1 si no existe
                  { upsert: true } // Crea el documento si no existe
                );
                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  TypeScore.CLIENTSCORE
                );
              }
            } else {
              const result = await ScoreClientModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: { $exists: false }, // Filtra registros donde offerUID NO exista
              });

              if (!result) {
                ScoreClientModel.create({
                  userId: uidUser,
                  entityId: uidEntity,
                  score: score,
                  comments: comments,
                });
                await CompanyModel.updateOne(
                  { uid: entity.uid },
                  { $inc: { customerCount: 1 } }, // Incrementa en 1 o lo crea con 1 si no existe
                  { upsert: true } // Crea el documento si no existe
                );
                await this.calculateScore(
                  entity.uid,
                  CompanyModel,
                  TypeScore.CLIENTSCORE
                );
              } else {
                return {
                  success: false,
                  code: 407,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
            }
            break;
          case "Provider":
            // entity.score_provider.push(newScore);
            if (offerID && type) {
              const result = await ScoreProviderModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: offerID,
              });
              if (result) {
                return {
                  success: false,
                  code: 407,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
              scoreData = new ScoreProviderModel(newScore);
              const savedScore = await scoreData.save();
              if (savedScore) {
                await CompanyModel.updateOne(
                  { uid: entity.uid },
                  { $inc: { sellerCount: 1 } }, // Incrementa en 1 o lo crea con 1 si no existe
                  { upsert: true } // Crea el documento si no existe
                );
                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  TypeScore.PROVIDERSCORE
                );
              }
            } else {
              const result = await ScoreProviderModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: { $exists: false }, // Filtra registros donde offerUID NO exista
              });
              if (!result) {
                ScoreProviderModel.create({
                  userId: uidUser,
                  entityId: uidEntity,
                  score: score,
                  comments: comments,
                });
                await CompanyModel.updateOne(
                  { uid: entity.uid },
                  { $inc: { sellerCount: 1 } }, // Incrementa en 1 o lo crea con 1 si no existe
                  { upsert: true } // Crea el documento si no existe
                );

                await this.calculateScore(
                  entity.uid,
                  CompanyModel,
                  TypeScore.PROVIDERSCORE
                );
              } else {
                return {
                  success: false,
                  code: 407,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
            }
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
        // await entity.save();

        if (offerID && type) {
          const OfferProductModel =
            mongoose.connection.collection("offersproducts");
          const OfferServiceModel =
            mongoose.connection.collection("offersservices");
          const OfferLiquidationModel =
            mongoose.connection.collection("offerliquidations");
          const resultOffer = await OfferProductModel.updateOne(
            { uid: offerID }, // Filtro para buscar por ID
            { $set: { cancelRated: true } } // Campos a actualizar
          );

          if (resultOffer.matchedCount < 1) {
            const resultService = await OfferServiceModel.updateOne(
              { uid: offerID }, // Filtro por ID
              { $set: { cancelRated: true } } // Campos a actualizar
            );

            if (resultService.matchedCount < 1) {
              const resultLiquidation = await OfferServiceModel.updateOne(
                { uid: offerID }, // Filtro por ID
                { $set: { cancelRated: true } } // Campos a actualizar
              );
            }
          }
        }

        return {
          success: true,
          code: 200,
          res: {
            msg: "Calificación agregada exitosamente",
          },
        };
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

        const newScore = {
          userId: userdata.uid,
          entityId: uidEntity,
          score,
          comments,
          offerId: offerID,
          type,
        };
        let scoreData;

        switch (typeScore) {
          case "Client":
            // entity.score_client.push(newScore);

            if (offerID && type) {
              const result = await ScoreClientModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: offerID,
              });
              if (result) {
                return {
                  success: false,
                  code: 407,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
              scoreData = new ScoreClientModel(newScore);
              let savedScore = await scoreData.save();
              if (savedScore) {
                await UserModel.updateOne(
                  { uid: entity.uid },
                  { $inc: { customerCount: 1 } }, // Incrementa en 1 o lo crea con 1 si no existe
                  { upsert: true } // Crea el documento si no existe
                );
                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  TypeScore.CLIENTSCORE
                );
              }
            } else {
              const result = await ScoreClientModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: { $exists: false }, // Filtra registros donde offerUID NO exista
              });

              if (!result) {
                ScoreClientModel.create({
                  userId: uidUser,
                  entityId: uidEntity,
                  score: score,
                  comments: comments,
                });
                await UserModel.updateOne(
                  { uid: entity.uid },
                  { $inc: { customerCount: 1 } }, // Incrementa en 1 o lo crea con 1 si no existe
                  { upsert: true } // Crea el documento si no existe
                );
                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  TypeScore.CLIENTSCORE
                );
              } else {
                return {
                  success: false,
                  code: 407,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
            }

            break;
          case "Provider":
            // entity.score_provider.push(newScore);
            if (offerID && type) {
              const result = await ScoreProviderModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: offerID,
              });
              if (result) {
                return {
                  success: false,
                  code: 407,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }

              scoreData = new ScoreProviderModel(newScore);
              let savedScore = await scoreData.save();

              if (savedScore) {
                await UserModel.updateOne(
                  { uid: entity.uid },
                  { $inc: { sellerCount: 1 } }, // Incrementa en 1 o lo crea con 1 si no existe
                  { upsert: true } // Crea el documento si no existe
                );

                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  TypeScore.PROVIDERSCORE
                );
              }
            } else {
              const result = await ScoreProviderModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: { $exists: false }, // Filtra registros donde offerUID NO exista
              });
              if (!result) {
                ScoreProviderModel.create({
                  userId: uidUser,
                  entityId: uidEntity,
                  score: score,
                  comments: comments,
                });
                await UserModel.updateOne(
                  { uid: entity.uid },
                  { $inc: { sellerCount: 1 } }, // Incrementa en 1 o lo crea con 1 si no existe
                  { upsert: true } // Crea el documento si no existe
                );

                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  TypeScore.PROVIDERSCORE
                );
              } else {
                return {
                  success: false,
                  code: 407,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
            }
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

        if (offerID && type) {
          const OfferProductModel =
            mongoose.connection.collection("offersproducts");
          const OfferServiceModel =
            mongoose.connection.collection("offersservices");
          const OfferLiquidationModel =
            mongoose.connection.collection("offerliquidations");
          const resultOffer = await OfferProductModel.updateOne(
            { uid: offerID }, // Filtro para buscar por ID
            { $set: { cancelRated: true } } // Campos a actualizar
          );

          if (resultOffer.matchedCount < 1) {
            const resultService = await OfferServiceModel.updateOne(
              { uid: offerID }, // Filtro por ID
              { $set: { cancelRated: true } } // Campos a actualizar
            );

            if (resultService.matchedCount < 1) {
              const resultLiquidation = await OfferServiceModel.updateOne(
                { uid: offerID }, // Filtro por ID
                { $set: { cancelRated: true } } // Campos a actualizar
              );
            }
          }
        }
        return {
          success: true,
          code: 200,
          res: {
            msg: "Puntaje agregado exitosamente",
          },
        };
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
  static calculateScore = async (
    entityID: string,
    entityModel: any,
    typeScore: TypeScore
  ) => {
    try {
      let fieldCount, fieldScore;
      if (typeScore === TypeScore.CLIENTSCORE) {
        fieldCount = "customerCount";
        fieldScore = "customerScore";
      } else {
        fieldCount = "sellerCount";
        fieldScore = "sellerScore";
      }
      const entity = await entityModel.aggregate([
        {
          $match: { uid: entityID }, // Filtra solo el usuario con ese UID
        },
        {
          $project: {
            _id: 0, // Excluye el campo _id
            uid: 1,
            [fieldCount]: 1,
            [fieldScore]: 1,
          },
        },
      ]);

      const pipeline = [
        {
          $match: { entityId: entityID }, // Filtra solo el usuario con ese UID
        },

        {
          $group: {
            _id: "$uid",
            totalScore: { $sum: "$score" }, // Accede directo
          },
        },
        {
          $project: {
            _id: 0,
            totalScore: 1,
          },
        },
      ];

      let scoresEntity, averageRating;
      if (typeScore === TypeScore.CLIENTSCORE) {
        scoresEntity = await ScoreClientModel.aggregate(pipeline);
        averageRating = scoresEntity[0].totalScore / entity[0].customerCount;
        await entityModel.updateOne(
          { uid: entityID }, // Filtro por ID
          { $set: { [fieldScore]: averageRating } } // Campos a actualizar
        );
      } else {
        scoresEntity = await ScoreProviderModel.aggregate(pipeline);
        averageRating = scoresEntity[0].totalScore / entity[0].sellerCount;
        await entityModel.updateOne(
          { uid: entityID }, // Filtro por ID
          { $set: { [fieldScore]: averageRating } } // Campos a actualizar
        );
      }
    } catch (error) {
      console.error(error);
    }
  };
  static getScoreCount = async (uid: string) => {
    let customerCount = 0;
    let sellerCount = 0;
    let customerScore = 0;
    let sellerScore = 0;
    try {
      const response: any = await AuthServices.getEntityService(uid);

      customerCount = response.data?.customerCount ?? 0;
      sellerCount = response.data?.sellerCount ?? 0;
      customerScore = response.data?.customerScore ?? 0;
      sellerScore = response.data?.sellerScore ?? 0;

      if (!response.success) {
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
