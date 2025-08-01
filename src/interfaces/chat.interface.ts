import { RequirementType } from "../types/globalTypes";

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
  type: RequirementType;
}

interface archiveI {
  userId: string;
  state: boolean;
}
