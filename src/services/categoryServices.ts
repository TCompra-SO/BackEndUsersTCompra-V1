import { categories } from "../utils/Categories";

export const getCategories = () => {
  try {
    // Devolver las categorías como resultado exitoso
    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    return {
      success: false,
      error: "No se pudieron obtener las categorías.",
    };
  }
};
