export interface CertificateI {
  uid: string;
  name: string;
  url: string;
  state: CertificationState;
  companyID: string;
  creationDate: Date;
  documentName: string;
  request?: [RequestsI]; //aqui veo a cuantas empresas se ha enviado
  urlRequest?: string;
  used?: boolean;
}

export interface RequestsI {
  receiverEntityID: string;
  certificateRequestID: string;
}

enum CertificationState {
  NONE = 0, // estado inicial cuando no se enviado o recibido certificados
  CERTIFIED = 1,
  REJECTED = 2,
  PENDING = 3,
  RESENT = 4,
}

export { CertificationState };
