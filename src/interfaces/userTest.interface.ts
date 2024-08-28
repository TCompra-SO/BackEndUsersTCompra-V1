import { Auth } from "./auth.interface";

export interface UserTest extends Auth {
  name: string;
  description: string;
}
