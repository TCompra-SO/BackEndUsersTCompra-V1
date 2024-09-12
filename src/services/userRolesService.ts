import { userRoles } from "./../utils/UserRoles";

export const getUserRoles = () => {
  try {
    // Devolver las categorías como resultado exitoso
    return {
      success: true,
      data: userRoles,
    };
  } catch (error) {
    console.error("Error al obtener los roles de usuario:", error);
    return {
      success: false,
      error: "No se pudieron obtener los roles de usuario.",
    };
  }
};
