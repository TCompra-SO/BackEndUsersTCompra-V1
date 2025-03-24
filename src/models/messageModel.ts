import mongoose, { Schema, Types, model, Model } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { MessageI } from "../interfaces/message.interface";
const uid = new ShortUniqueId({ length: 20 });

const messageSchema = new Schema<MessageI>({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: () => uid.rnd(),
  },
  chatId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
  images: {
    type: [String],
    required: false,
  },
  documents: {
    type: [String],
    required: false,
  },
});
// Crear el modelo basado en el esquema
const MessageModel: Model<MessageI> = model<MessageI>(
  "Messages",
  messageSchema
);

export default MessageModel;
