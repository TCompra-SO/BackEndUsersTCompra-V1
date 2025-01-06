import mongoose, { Schema, Document } from "mongoose";
import { ResourceCountersI } from "../interfaces/resourceCounters";
// Define the schema
const ResourceCountersSchema = new Schema<ResourceCountersI>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
    },
    typeEntity: {
      type: String,
      required: true,
    },
    numProducts: {
      type: Number,
      default: 0,
    },
    numServices: {
      type: Number,
      default: 0,
    },
    numLiquidations: {
      type: Number,
      default: 0,
    },
    numOffers: {
      type: Number,
      default: 0,
    },
    numPurchaseOrdersProvider: {
      type: Number,
      default: 0,
    },
    numPurchaseOrdersClient: {
      type: Number,
      default: 0,
    },
    numSellingOrdersProvider: {
      type: Number,
      default: 0,
    },
    numSellingOrdersClient: {
      type: Number,
      default: 0,
    },
    updateDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Create the model
export const ResourceCountersModel = mongoose.model<ResourceCountersI>(
  "ResourceCounters",
  ResourceCountersSchema
);
