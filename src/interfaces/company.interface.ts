// interfaces/User.ts

import { AuthUserI } from "./authUser.interface";
import { MetadataI } from "./utils.interface";

export interface CompanyI {
  uid: string;
  document: string;
  name: string;
  phone: string;
  address: string;
  country: string;
  city: string;
  categories: number[]; // Array de cadenas
  age: number;
  specialtyID: number;
  about_me?: string; // Opcional
  auth_users: AuthUserI; // Objeto anidado
  email: string;
  password: string;
  typeID: number;
  avatar?: string; // Opcional
  planID: string;
  metadata?: MetadataI;
  ultimate_session: Date;
}
