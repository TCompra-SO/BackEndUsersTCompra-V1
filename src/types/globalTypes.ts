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
