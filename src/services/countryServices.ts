// countryService.ts
import { countries } from "../utils/Countries";

// Servicio para obtener todos los países y ciudades o un país específico por ID
export const getCountries = (id?: string) => {
  // Asegúrate de que `id` es opcional
  try {
    if (id) {
      // Filtramos el país por ID
      const country = countries.find((country) => country.id === id);
      if (country) {
        return {
          success: true,
          data: country,
        };
      } else {
        return {
          success: false,
          error: "Country not found",
        };
      }
    }

    // Si no se proporciona ID, retornamos todos los países
    return {
      success: true,
      data: countries,
    };
  } catch (error) {
    return {
      success: false,
      error: "Error retrieving countries",
    };
  }
};
