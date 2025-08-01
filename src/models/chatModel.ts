import mongoose, { Schema, Types, model, Model } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { ChatI } from "../interfaces/chat.interface";
const uid = new ShortUniqueId({ length: 20 });

const chatSchema = new Schema<ChatI>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      default: () => uid.rnd(),
    },
    userOnline: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    requerimentId: {
      type: String,
      required: true,
    },
    chatPartnerId: {
      type: String,
      required: true,
    },
    lastMessage: {
      type: String,
      required: false,
    },
    lastDate: {
      type: Date,
      required: false,
    },
    unReadUser: {
      type: Number,
      default: 0,
      min: 0,
    },
    unReadPartner: {
      type: Number,
      default: 0,
      min: 0,
    },
    archive: {
      type: [{ userId: String, state: Boolean }],
      default: [],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
// Crear el modelo basado en el esquema
const ChatModel: Model<ChatI> = model<ChatI>("Chats", chatSchema);

export default ChatModel;
