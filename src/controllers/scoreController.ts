import { Request, Response, response } from "express";
import { ScoreService } from "../services/scoreServices";
import { io } from "../server";
import { RequestExt } from "../interfaces/req-ext";
import { AuthServices } from "../services/authServices";
const registerScoreController = async (req: RequestExt, res: Response) => {
  const {
    typeScore,
    uidEntity,
    uidUser,
    score,
    comments,
    offerId,
    requerimentId,
    type,
  } = req.body;
  try {
    const { user } = req; // Extraemos `user` y `body` de la request
    //const { uid: userUID } = user as JwtPayload; // Obtenemos `uid` del usuario autenticado

    const datatoken = await AuthServices.getDataBaseUser(uidUser);
    //const dataus = await AuthServices.getDataBaseUser(uidUser);
    let token;

    if (datatoken.data?.[0].auth_users) {
      token = datatoken.data?.[0].auth_users.accessToken;
    } else {
      token = datatoken.data?.[0].accessToken;
    }

    const responseUser = await ScoreService.registerScore(
      typeScore,
      uidEntity,
      uidUser,
      score,
      comments,
      offerId,
      requerimentId,
      type,
      token
    );

    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
      //ANALIZAR ESTO

      if (offerId) {
        const roomName = `roomScore${responseUser.res?.offerData.data?.[0].user}`;

        io.to(roomName).emit("updateRoom", {
          dataPack: responseUser.res?.offerData,
          typeSocket: responseUser.res?.typeSocket,
          key: responseUser.res?.offerData.data?.[0].key,
          userId: responseUser.res?.offerData.data?.[0].subUser,
        });
      }
    } else {
      res.status(responseUser.code).send(responseUser);
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
