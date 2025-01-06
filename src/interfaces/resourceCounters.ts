import { TypeEntity } from "../types/globalTypes";

export interface ResourceCountersI {
  uid: string;
  typeEntity: TypeEntity;
  numProducts: number;
  numServices: number;
  numLiquidations: number;
  numOffersProducts: number;
  numOffersServices: number;
  numOffersLiquidations: number;
  numPurchaseOrdersProvider: number;
  numPurchaseOrdersClient: number;
  numSellingOrdersProvider: number;
  numSellingOrdersClient: number;
  updateDate: Date;
  numSubUsers: number;
  numSentApprovedCertifications: number;
  numReceivedApprovedCertifications: number;
}
