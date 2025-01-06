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
    numOffersProducts: {
      type: Number,
      default: 0,
    },
    numOffersServices: {
      type: Number,
      default: 0,
    },
    numOffersLiquidations: {
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
    numSubUsers: {
      type: Number,
      default: 0,
    },
    updateDate: {
      type: Date,
      default: Date.now,
    },
    numReceivedApprovedCertifications: {
      type: Number,
      default: 0,
    },
    numSentApprovedCertifications: {
      type: Number,
      default: 0,
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
