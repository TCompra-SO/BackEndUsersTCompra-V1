import { Schema, model, Document } from "mongoose";

import { SessionI } from "../interfaces/session.interface";
const SessionSchema = new Schema<SessionI>({
  userId: { type: String, ref: "User", required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  userAgent: { type: String },
  ipAgent: { type: String },
  browserId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, required: true },
});

const SessionModel = model("sessions", SessionSchema);
export default SessionModel;
