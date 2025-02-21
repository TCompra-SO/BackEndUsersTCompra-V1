// interfaces/User.ts

import { AuthUserI } from "./authUser.interface";
import { MetadataI } from "./utils.interface";
import { ScoreI } from "./score.interface";
export interface CompanyI {
  uid: string;
  document: string;
  name: string;
  phone: string;
  address: string;
  countryID: number;
  cityID: number;
  categories: number[]; // Array de cadenas
  age: number;
  specialtyID?: string;
  about_me?: string; // Opcional
  auth_users: [AuthUserI]; // Objeto anidado
  score_provider: [ScoreI];
  score_client: [ScoreI];
  email: string;
  password: string;
  typeID: number;
  avatar?: string; // Opcional
  planID: number;
  metadata?: MetadataI;
  ultimate_session: Date;
  verified: boolean;
  active_account: boolean;
  requiredDocuments: string;
  customerCount: number;
  customerScore: number;
  sellerCount: number;
  sellerScore: number;
}
