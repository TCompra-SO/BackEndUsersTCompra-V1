import mongoose, { Schema, model, Model } from "mongoose";
import { ScoreI } from "../interfaces/score.interface";

const scoreClientSchema = new Schema<ScoreI>({
  userId: {
    type: String,
    required: true,
  },
  entityId: {
    type: String,
    required: true,
  },
  score: {
    type: Number,
    required: true,
  },
  comments: {
    type: String,
    required: false,
  },
  offerId: {
    type: String,
    required: false,
  },
  type: {
    type: Number,
    required: false,
  },
});

// Crear el modelo basado en el esquema
const ScoreClientModel: Model<ScoreI> = model<ScoreI>(
  "score_clients",
  scoreClientSchema
);

export default ScoreClientModel;
