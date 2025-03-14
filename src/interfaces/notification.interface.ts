import { NotificationType } from "../types/globalTypes";

export interface BaseNotificationI {
  senderImage?: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  title: string;
  body: string;
  action: number;
  receiverId?: string;
  categoryId?: number;
  targetId?: string;
  targetType: number;
  type: NotificationType;
  expiresAt: Date;
}

export interface NotificationI extends BaseNotificationI {
  uid: string;
}
