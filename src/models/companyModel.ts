import mongoose, { Schema, Types, model, Model } from "mongoose";
import { CompanyI } from "../interfaces/company.interface";
import ShortUniqueId from "short-unique-id";
import { create } from "domain";
import { required } from "joi";

const uid = new ShortUniqueId({ length: 20 });

const AuthUserSchema = new Schema({
  Uid: {
    type: String,
    required: true,
    unique: true,
    default: () => uid.rnd(),
  },
  email: { type: String, required: true },
  password: { type: String, required: true },
  typeID: { type: Number, required: true },
  ultimate_session: { type: Date, default: Date.now, required: false },
  active_account: { type: Boolean, required: false },
});

const ScoreSchema = new Schema({
  uid: { type: String, required: true },
  score: { type: Number, required: true },
  comments: { type: String, required: false },
});

const CompanySchema = new Schema<CompanyI>(
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
    },
    age: {
      type: Number,
      required: false,
    },
    specialtyID: {
      type: String,
      required: false,
    },
    about_me: {
      type: String,
      required: false,
    },
    auth_users: {
      type: [AuthUserSchema],
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
    email: {
      type: String,
      required: true,
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
    },
    planID: {
      type: Number,
      required: false,
    },
    metadata: {
      type: Object,
      require: false,
    },
    ultimate_session: {
      type: Date,
      default: Date.now,
      required: false,
    },
    verified: {
      type: Boolean,
      required: false,
    },
    active_account: {
      type: Boolean,
      required: false,
    },
    requiredDocuments: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const CompanyModel = mongoose.model<CompanyI>("Companys", CompanySchema);
export default CompanyModel;
