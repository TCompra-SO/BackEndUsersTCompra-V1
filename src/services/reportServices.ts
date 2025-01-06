import { ResourceCountersModel } from "../models/resourceCountersModel";

export class ReportServices {
  static getCountsByEntity = async (uid: string) => {
    try {
      const resoucerCounters = await ResourceCountersModel.findOne({
        uid: uid,
      });

      // Definir los campos esperados con valores por defecto
      const defaultFields = {
        numProducts: 0,
        numServices: 0,
        numLiquidations: 0,
        numOffersProducts: 0,
        numOffersServices: 0,
        numOffersLiquidations: 0,
        numPurchaseOrdersClient: 0,
        numPurchaseOrdersProvider: 0,
        numSellingOrdersProvider: 0,
        numSellingOrdersClient: 0,
        numSentApprovedCertifications: 0,
        numReceivedApprovedCertifications: 0,
        numSubUsers: 0,
      };

      // Combinar el documento encontrado con los valores por defecto
      const data = resoucerCounters
        ? { ...defaultFields, ...resoucerCounters.toObject() }
        : defaultFields;

      return {
        success: true,
        code: 200,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno con el Servidor",
        },
      };
    }
  };
}
