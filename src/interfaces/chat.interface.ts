export interface ChatI {
  uid: string;
  userImage?: string;
  userName?: string;
  userOnline?: boolean;
  userId: string;
  title: string;
  requerimentId: string;
  chatPartnerId: string;
  lastMessage: string;
  lastDate: Date;
  unReadUser: number;
  unReadPartner: number;
  archive?: archiveI[];
  createdAt: Date;
}

interface archiveI {
  userId: string;
  state: boolean;
}
