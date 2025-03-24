export interface MessageI {
  uid: string;
  chatId: string;
  userId: string;
  message: string;
  timestamp: Date;
  read: boolean;
  images?: string[];
  documents?: string[];
}
