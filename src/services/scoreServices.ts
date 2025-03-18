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
import { CollectionType, TypeScore, TypeSocket } from "../types/globalTypes";
import dotenv from "dotenv";
import axios from "axios";
import { getToken } from "../utils/authStore";
import { JwtPayload } from "jsonwebtoken";

export class ScoreService {
  static registerScore = async (
    typeScore: string,
    uidEntity: string,
    uidUser: string,
    score: number,
    comments: string,
    offerID?: string,
    requerimentId?: string,
    type?: CollectionType,
    token?: string
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
                  code: 409,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }

              scoreData = new ScoreClientModel(newScore);
              let savedScore = await scoreData.save();
              if (savedScore) {
                await this.calculateScore(
                  entity.uid,
                  CompanyModel,
                  score,
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

                await this.calculateScore(
                  entity.uid,
                  CompanyModel,
                  score,
                  TypeScore.CLIENTSCORE
                );
              } else {
                return {
                  success: false,
                  code: 409,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
            }
            break;
          case "Provider":
            // entity.score_provider.push(newScore);
            console.log(offerID);
            if (offerID && type) {
              const result = await ScoreProviderModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: offerID,
              });
              console.log(result);
              if (result) {
                return {
                  success: false,
                  code: 409,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
              scoreData = new ScoreProviderModel(newScore);
              const savedScore = await scoreData.save();
              if (savedScore) {
                await this.calculateScore(
                  entity.uid,
                  CompanyModel,
                  score,
                  TypeScore.PROVIDERSCORE
                );
              }
            } else {
              //aqui esta el error corregirlo culminate postman liquidations

              const result = await ScoreProviderModel.findOne({
                entityId: uidEntity,
                userId: uidUser,
                offerId: { $exists: false }, // Filtra registros donde offerUID NO exista
              });

              console.log(result);
              if (!result) {
                ScoreProviderModel.create({
                  userId: uidUser,
                  entityId: uidEntity,
                  score: score,
                  comments: comments,
                });

                await this.calculateScore(
                  entity.uid,
                  CompanyModel,
                  score,
                  TypeScore.PROVIDERSCORE
                );
              } else {
                return {
                  success: false,
                  code: 409,
                  error: {
                    msg: "Ya haz calificado al Usuario n",
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
        let typeService;
        if (offerID && type) {
          const OfferProductModel =
            mongoose.connection.collection("offersproducts");
          const OfferServiceModel =
            mongoose.connection.collection("offersservices");
          const OfferLiquidationModel =
            mongoose.connection.collection("offersliquidations");
          const resultOffer = await OfferProductModel.updateOne(
            { uid: offerID }, // Filtro para buscar por ID
            { $set: { cancelRated: true } } // Campos a actualizar
          );
          typeService = "OfferProduct";
          if (resultOffer.matchedCount < 1) {
            const resultService = await OfferServiceModel.updateOne(
              { uid: offerID }, // Filtro por ID
              { $set: { cancelRated: true } } // Campos a actualizar
            );
            typeService = "OfferService";
            if (resultService.matchedCount < 1) {
              const resultLiquidation = await OfferLiquidationModel.updateOne(
                { uid: offerID }, // Filtro por ID
                { $set: { cancelRated: true } } // Campos a actualizar
              );
              typeService = "OfferLiquidation";
            }
          }
        }
        let API_POINT;
        let endpoint;
        let offerData;
        if (offerID) {
          dotenv.config();
          switch (typeService) {
            case "OfferProduct":
              API_POINT = process.env.API_PRODUCTS || "";
              endpoint = "/v1/offers/getDetailOffer/" + offerID;
              break;
            case "OfferService":
              API_POINT = process.env.API_SERVICES || "";
              endpoint = "/v1/offers/getDetailOffer/" + offerID;
              break;
            case "OfferLiquidation":
              API_POINT = process.env.API_LIQUIDATIONS || "";
              endpoint = "/v1/offers/getDetailOffer/" + offerID;
            default:
              break;
          }

          try {
            offerData = await axios.get(`${API_POINT}${endpoint}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (error) {
            if (axios.isAxiosError(error)) {
              return {
                success: false,
                code: 401,
                error: {
                  msg: error.response?.data.msg,
                },
              };
            } else {
              console.error("Error desconocido:", error);
            }
          }
        }

        const typeSocket = TypeSocket.UPDATE;

        return {
          success: true,
          code: 200,
          res: {
            msg: "Calificación agregada exitosamente",
            typeService: typeService,
            offerData: offerData?.data ?? {},
            typeSocket: typeSocket,
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
                  code: 409,
                  error: {
                    msg: "Ya haz calificado al Usuario",
                  },
                };
              }
              scoreData = new ScoreClientModel(newScore);
              let savedScore = await scoreData.save();
              if (savedScore) {
                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  score,
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

                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  score,
                  TypeScore.CLIENTSCORE
                );
              } else {
                return {
                  success: false,
                  code: 409,
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
                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  score,
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

                await this.calculateScore(
                  entity.uid,
                  UserModel,
                  score,
                  TypeScore.PROVIDERSCORE
                );
              } else {
                return {
                  success: false,
                  code: 409,
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
        let typeService;
        if (offerID && type) {
          const OfferProductModel =
            mongoose.connection.collection("offersproducts");

          const OfferServiceModel =
            mongoose.connection.collection("offersservices");
          const OfferLiquidationModel =
            mongoose.connection.collection("offersliquidations");
          const resultOffer = await OfferProductModel.updateOne(
            { uid: offerID }, // Filtro para buscar por ID
            { $set: { cancelRated: true } } // Campos a actualizar
          );
          typeService = "OfferProduct";

          if (resultOffer.matchedCount < 1) {
            const resultService = await OfferServiceModel.updateOne(
              { uid: offerID }, // Filtro por ID
              { $set: { cancelRated: true } } // Campos a actualizar
            );
            typeService = "OfferService";
            if (resultService.matchedCount < 1) {
              const resultLiquidation = await OfferLiquidationModel.updateOne(
                { uid: offerID }, // Filtro por ID
                { $set: { cancelRated: true } } // Campos a actualizar
              );
              typeService = "OfferLiquidation";
            }
          }
        }

        let API_POINT;
        let endpoint;
        let offerData;
        if (offerID) {
          dotenv.config();
          switch (typeService) {
            case "OfferProduct":
              API_POINT = process.env.API_PRODUCTS || "";
              endpoint = "/v1/offers/getDetailOffer/" + offerID;
              break;
            case "OfferService":
              API_POINT = process.env.API_SERVICES || "";
              endpoint = "/v1/offers/getDetailOffer/" + offerID;
              break;
            case "OfferLiquidation":
              API_POINT = process.env.API_LIQUIDATIONS || "";
              endpoint = "/v1/offers/getDetailOffer/" + offerID;
            default:
              break;
          }

          try {
            offerData = await axios.get(`${API_POINT}${endpoint}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (error) {
            if (axios.isAxiosError(error)) {
              return {
                success: false,
                code: 401,
                error: {
                  msg: error.response?.data.msg,
                },
              };
            } else {
              console.error("Error desconocido:", error);
            }
          }
        }

        const typeSocket = TypeSocket.UPDATE;
        return {
          success: true,
          code: 200,
          res: {
            msg: "Calificación agregada exitosamente",
            typeService: typeService,
            offerData: offerData?.data ?? {},
            typeSocket: typeSocket,
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
    score: number,
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

      // Obtener la entidad actual
      const entity = await entityModel.aggregate([
        { $match: { uid: entityID } },
        {
          $project: {
            _id: 0,
            uid: 1,
            [fieldCount]: 1,
            [fieldScore]: 1,
          },
        },
      ]);

      let newCount, newScore;

      if (entity.length === 0 || entity[0][fieldCount] == null) {
        // Si no hay datos previos, inicializamos
        newCount = 1;
        newScore = score;
      } else {
        // Si hay datos previos, calcular el nuevo promedio
        newCount = entity[0][fieldCount] + 1;
        newScore =
          (entity[0][fieldScore] * entity[0][fieldCount] + score) / newCount;
      }

      // Actualizar la entidad o crearla si no existe
      await entityModel.updateOne(
        { uid: entityID },
        {
          $set: { [fieldScore]: newScore, [fieldCount]: newCount },
        },
        { upsert: true } // Crea el documento si no existe
      );
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
