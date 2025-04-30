export interface SessionI {
  userId: string;
  accessToken: string;
  refreshToken: string;
  userAgent: string;
  ipAgent: string;
  browserId: string;
  createdAt: Date;
  updatedAt: Date;
}
