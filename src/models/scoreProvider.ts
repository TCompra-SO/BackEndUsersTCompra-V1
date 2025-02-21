import mongoose, { Schema, model, Model } from "mongoose";
import { ScoreI } from "../interfaces/score.interface";

const scoreProviderSchema = new Schema<ScoreI>({
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
const ScoreProviderModel: Model<ScoreI> = model<ScoreI>(
  "score_providers",
  scoreProviderSchema
);

export default ScoreProviderModel;
