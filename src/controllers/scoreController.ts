import { Request, Response, response } from "express";
import { ScoreService } from "../services/scoreServices";
import { io } from "../server";
import { RequestExt } from "../interfaces/req-ext";
import { JwtPayload } from "jsonwebtoken";
import { getToken } from "../utils/authStore";
const registerScoreController = async (req: RequestExt, res: Response) => {
  const { typeScore, uidEntity, uidUser, score, comments, offerId, type } =
    req.body;
  try {
    const { user } = req; // Extraemos `user` y `body` de la request
    //const { uid: userUID } = user as JwtPayload; // Obtenemos `uid` del usuario autenticado

    const responseUser = await ScoreService.registerScore(
      typeScore,
      uidEntity,
      uidUser,
      score,
      comments,
      offerId,
      type
    );

    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
      //ANALIZAR ESTO

      if (offerId) {
        const roomName = `room${
          responseUser.res?.typeService +
          responseUser.res?.offerData.data?.[0].user
        }`;
        io.to(roomName).emit("updateRoom", {
          dataPack: responseUser.res?.offerData,
          typeSocket: responseUser.res?.typeSocket,
          key: responseUser.res?.offerData.data?.[0].key,
          userId: responseUser.res?.offerData.data?.[0].subUser,
        });
      }
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en registerScoreController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const getScoreCountController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await ScoreService.getScoreCount(uid);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en registerScoreController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export { registerScoreController, getScoreCountController };
