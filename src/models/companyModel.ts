import mongoose, { Schema, Types, model, Model } from "mongoose";
import { CompanyI } from "../interfaces/company.interface";
import ShortUniqueId from "short-unique-id";
const AuthUserSchema = new Schema(
  {
    id: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    typeID: { type: Number, required: true },
    profileID: { type: String, required: true },
  },
  { _id: false } // Si no necesitas un _id para cada subdocumento
);

const uid = new ShortUniqueId({ length: 20 });

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
    country: {
      type: String,
      required: false,
    },
    city: {
      type: String,
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
      type: Number,
      required: false,
    },
    about_me: {
      type: String,
      required: false,
    },
    auth_users: {
      type: AuthUserSchema,
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
      type: String,
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
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const CompanyModel = mongoose.model<CompanyI>("Companys", CompanySchema);
export default CompanyModel;
