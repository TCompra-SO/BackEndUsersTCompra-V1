import { UtilData } from "../utils/UtilData";
import { UtilDataType } from "../types/globalTypes";

export const getUtilData = (type: UtilDataType) => {
  try {
    // Accede a la primera entrada de UtilData y busca por el parámetro 'type'
    const result = UtilData[0][type];

    if (result) {
      return {
        success: true,
        data: result,
      };
    } else {
      return {
        success: false,
        error: `No se encontraron datos para el tipo: ${type}`,
      };
    }
  } catch (error) {
    console.error("Error al obtener los datos de utilidad:", error);
    return {
      success: false,
      error: "No se pudieron obtener los datos de utilidad.",
    };
  }
};
