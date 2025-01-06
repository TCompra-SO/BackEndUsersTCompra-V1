export interface UserMasterI {
  uid: string;
  username: string;
  email: string;
  password: string;
  role: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
