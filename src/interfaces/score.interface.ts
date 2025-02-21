export interface ScoreI {
  userId: string; // Usuario que califica
  entityId: string; // Empresa calificada
  score: number;
  comments: string;
  offerId?: string;
  type?: number;
}
