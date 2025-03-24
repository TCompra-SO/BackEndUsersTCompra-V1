export interface ChatI {
  uid: string;
  userImage?: string;
  userName?: string;
  userOnline?: boolean;
  userId: string;
  title: string;
  requirementId: string;
  lastMessage: string;
  lastDate: string;
  numUnreadMessages?: number;
  createdAt: Date;
}
