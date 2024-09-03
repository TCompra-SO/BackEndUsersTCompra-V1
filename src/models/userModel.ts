import mongoose, { Schema, Types, model, Model } from "mongoose";
import { UserI } from "../interfaces/user.interface";
import ShortUniqueId from "short-unique-id";

const uid = new ShortUniqueId({ length: 20 });

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
      require: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const UserModel = mongoose.model<UserI>("Users", userSchema);
export default UserModel;
