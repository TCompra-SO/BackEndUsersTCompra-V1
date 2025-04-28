import mongoose, { Schema, model, Model } from "mongoose";
import { PlanI } from "../interfaces/plan.interface";
import ShortUniqueId from "short-unique-id";

const uid = new ShortUniqueId({ length: 20 });

const planSchema = new Schema<PlanI>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      default: () => uid.rnd(),
    },

    goods: {
      type: Number,
      required: true,
      default: 0,
    },
    services: {
      type: Number,
      required: true,
      default: 0,
    },
    sales: {
      type: Number,
      required: true,
      default: 0,
    },
    offersGoods: {
      type: Number,
      required: true,
      default: 0,
    },
    offersServices: {
      type: Number,
      required: true,
      default: 0,
    },
    offersSales: {
      type: Number,
      required: true,
      default: 0,
    },
    premium: {
      type: Boolean,
      required: true,
    },
    default: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Crear el modelo basado en el esquema
const PlanModel: Model<PlanI> = model<PlanI>("Plans", planSchema);

export default PlanModel;
