import { Schema, model, Document } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { UserMasterI } from "../interfaces/userMaster.interface";

const uid = new ShortUniqueId({ length: 20 });

const UserMasterSchema = new Schema<UserMasterI>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      default: () => uid.rnd(),
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const UserMasterModel = model<UserMasterI>(
  "UserMaster",
  UserMasterSchema
);
