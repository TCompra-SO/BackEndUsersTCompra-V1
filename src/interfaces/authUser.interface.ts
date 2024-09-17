export interface AuthUserI {
  Uid: string;
  email: string;
  password: string;
  typeID: number;
  ultimate_session: Date;
  active_account: boolean; // Tipo literal
}
