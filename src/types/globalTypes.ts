export type UtilDataType =
  | "currency"
  | "method_payment"
  | "delivery_time"
  | "type_bidders"
  | "types_plans";

export enum CollectionType {
  PRODUCTS = 1,
  SERVICES = 2,
  LIQUIDATIONS = 3,
  OFFERS = 4,
  PURCHASEORDERS = 5,
  PURCHASEORDERSPRODUCTS = "purchaseorderproducts",
}

export enum TypeOrder {
  PROVIDER = 1,
  CLIENT = 2,
}

export enum TypeEntity {
  COMPANY = "Company",
  USER = "User",
  SUBUSER = "SubUser",
  MASTER = "Master",
}

export enum TypeScore {
  CLIENTSCORE = 0,
  PROVIDERSCORE = 1,
}

export enum OrderType {
  ASC = 1,
  DESC = 2,
}

export enum TypeSocket {
  CREATE = 0,
  UPDATE = 1,
  DELETE = 2,
  UPDATE_FIELD = 4,
}

export enum NotificationAction {
  VIEW_REQUIREMENT = 25,
  VIEW_CERTIFICATION = 40,
  VIEW_HISTORY = 15,
  VIEW_OFFER = 26,
  DOWNLOAD_PURCHASE_ORDER = 12,
  VIEW_CAT_LAST_REQUIREMENTS = 41,
}

export enum RequirementType {
  GOOD = 1,
  SERVICE = 2,
  SALE = 3,
}

export enum NotificationType {
  DIRECT = 0,
  BROADCAST = 1,
}

export enum CertificateRooms {
  DOCUMENT = "docCert",
  SENT = "sentCert",
  RECEIVED = "receivedCert",
}

export enum CertificationType {
  SENT = 1,
  RECEIVED = 2,
}
