import mongoose, { Schema } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { NotificationI } from "../interfaces/notification.interface";
import { NotificationType } from "../types/globalTypes";
import { boolean, required } from "joi";

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
    required: false,
  },
  targetId: {
    type: String,
    required: false,
  },
  extraTargetType: {
    type: Number,
    required: false,
  },
  targetType: {
    type: Number,
    required: true,
  },
  type: {
    type: Number,
    enum: [NotificationType.DIRECT, NotificationType.BROADCAST],
    required: true,
  },
  expiresAt: {
    type: Date,
    index: { expires: 0 },
  },
  categoryId: {
    type: Number,
    required: false,
  },
  read: {
    type: Boolean,
    required: true,
    default: false,
    set: (v: any) => (v === undefined ? false : v),
  },
});

// Exporta el modelo
const NotificationModel = mongoose.model<NotificationI>(
  "Notifications",
  NotificationSchema
);

export default NotificationModel;
