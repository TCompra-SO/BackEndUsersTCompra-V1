import { Schema, Types, model, Model } from "mongoose";
import { Car } from "../interfaces/car.interface";
import { UserTest } from "../interfaces/userTest.interface";
const UserTestSchema = new Schema<UserTest>(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const UserTestModel = model("userTest", UserTestSchema);
export default UserTestModel;
