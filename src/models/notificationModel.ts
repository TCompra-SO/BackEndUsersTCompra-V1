import mongoose, { Schema } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { NotificationI } from "../interfaces/notification.interface";

const uid = new ShortUniqueId({ length: 20 });

const NotificationSchema: Schema = new Schema<NotificationI>({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: () => uid.rnd(),
  },
  senderImage: {
    type: String,
    required: false,
  },
  senderId: {
    type: String,
    required: true,
  },
  senderName: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: { expires: "30d" },
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  action: {
    type: Number,
    required: true,
  },
  receiverId: {
    type: String,
    required: true,
  },
  targetId: {
    type: String,
    required: true,
  },
  targetType: {
    type: Number,
    required: true,
  },
});

// Exporta el modelo
const NotificationModel = mongoose.model<NotificationI>(
  "Notifications",
  NotificationSchema
);

export default NotificationModel;
