import { Request, Response, response } from "express";
import { ScoreService } from "../services/scoreServices";

const registerScoreController = async ({ body }: Request, res: Response) => {
  const { typeScore, uidEntity, uidUser, score, comments, offerId, type } =
    body;
  try {
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
