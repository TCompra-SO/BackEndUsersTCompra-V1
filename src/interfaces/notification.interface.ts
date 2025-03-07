export interface NotificationI {
  uid: string;
  senderImage?: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  title: string;
  body: string;
  action: number;
  receiverId: string;
  targetId: string;
  targetType: number;
}
