import mongoose, { Schema, Types, model, Model } from "mongoose";
import { UserI } from "../interfaces/user.interface";
import ShortUniqueId from "short-unique-id";
import { number } from "joi";

const uid = new ShortUniqueId({ length: 20 });

const ScoreSchema = new Schema({
  uid: { type: String, required: true },
  score: { type: Number, required: true },
  comments: { type: String, required: false },
});

const userSchema = new Schema<UserI>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      default: () => uid.rnd(),
    },
    document: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: false,
    },
    countryID: {
      type: Number,
      required: false,
    },
    cityID: {
      type: Number,
      required: false,
    },
    categories: {
      type: [Number],
      required: false,
    }, // Array de cadenas
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    typeID: {
      type: Number,
      required: true,
    },
    avatar: {
      type: String,
      required: false,
    }, // Opcional
    planID: {
      type: Number,
      required: false,
    },
    score_provider: {
      type: [ScoreSchema],
      required: false,
    },
    score_client: {
      type: [ScoreSchema],
      required: false,
    },
    metadata: {
      type: Object,
      required: false,
    },
    ultimate_session: {
      type: Date,
      default: Date.now,
      required: false,
    },
    active_account: {
      type: Boolean,
      required: false,
    },
    customerCount: {
      type: Number,
      default: 0,
      required: false,
    },
    customerScore: {
      type: Number,
      default: 0,
      required: false,
    },
    sellerCount: {
      type: Number,
      default: 0,
      required: false,
    },
    sellerScore: {
      type: Number,
      default: 0,
      required: false,
    },
    refreshToken: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const UserModel = mongoose.model<UserI>("Users", userSchema);
export default UserModel;
