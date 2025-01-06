import { TypeEntity } from "../types/globalTypes";

export interface ResourceCountersI {
  uid: string;
  typeEntity: TypeEntity;
  numProducts: number;
  numServices: number;
  numLiquidations: number;
  numOffers: number;
  numPurchaseOrdersProvider: number;
  numPurchaseOrdersClient: number;
  numSellingOrdersProvider: number;
  numSellingOrdersClient: number;
  updateDate: Date;
}
