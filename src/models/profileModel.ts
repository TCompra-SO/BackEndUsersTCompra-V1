import mongoose, { Schema, model, Model } from "mongoose";
import { ProfileI } from "../interfaces/profile.interface";
import ShortUniqueId from "short-unique-id";

const uid = new ShortUniqueId({ length: 20 });

const profileSchema = new Schema<ProfileI>(
  {
    profileID: {
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
    cityID: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: false,
    },
    uid: {
      type: String,
      required: true,
    },
    companyID: {
      type: String,
      required: true,
    }, // Opcional
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

// Crear el modelo basado en el esquema
const ProfileModel: Model<ProfileI> = model<ProfileI>(
  "Profiles",
  profileSchema
);

export default ProfileModel;
