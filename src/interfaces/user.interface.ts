import { MetadataI } from "./utils.interface";

export interface UserI {
  uid: string; // Identificador único del usuario
  document: string; // Número de documento del usuario
  name: string; // Nombre completo del usuario
  phone: string; // Número de teléfono del usuario
  address: string; // Dirección del usuario
  country: string; // País del usuario
  city: string; // Ciudad del usuario
  categories: number[]; // Array de categorías del usuario
  email: string; // Correo electrónico del usuario
  password: string;
  typeID: number; // Contraseña del usuario
  avatar?: string; // URL del avatar del usuario (opcional)
  planID: string;
  metadata?: MetadataI;
  ultimate_session: Date; // Identificador del plan al que el usuario está suscrito
}
