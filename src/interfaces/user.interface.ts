import { MetadataI } from "./utils.interface";
import { ScoreI } from "./score.interface";
export interface UserI {
  uid: string; // Identificador único del usuario
  document: string; // Número de documento del usuario
  name: string; // Nombre completo del usuario
  phone: string; // Número de teléfono del usuario
  address: string; // Dirección del usuario
  countryID: number; // País del usuario
  cityID: number; // Ciudad del usuario
  categories: number[]; // Array de categorías del usuario
  email: string; // Correo electrónico del usuario
  password: string;
  typeID: number; // Contraseña del usuario
  avatar?: string; // URL del avatar del usuario (opcional)
  planID: string;
  metadata?: MetadataI;
  score_provider: [ScoreI];
  score_client: [ScoreI];
  ultimate_session: Date;
  active_account: boolean; // Identificador del plan al que el usuario está suscrito
  customerCount: number;
  customerScore: number;
  sellerCount: number;
  sellerScore: number;
  refreshToken?: string;
  accessToken?: string;
  online?: boolean;
  premiun?: boolean;
  isSystemAdmin?: boolean;
}
