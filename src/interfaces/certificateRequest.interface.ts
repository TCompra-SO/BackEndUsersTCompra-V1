import { CertificationState, CertificateI } from "./certificate.interface";

export interface CertificateRequestI {
  uid: string;
  certificates: Object; // uid, state
  state: CertificationState;
  receiverEntityID: string;
  sendByentityID: string;
  note?: string;
}
