import { NotificationType } from "../types/globalTypes";

export interface NotificationI {
  uid: string;
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
