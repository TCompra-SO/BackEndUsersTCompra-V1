import { CookieOptions } from "express";

/**
 * Retorna configuración de cookie según modo (desarrollo o producción)
 * @param maxAge Tiempo de expiración en milisegundos
 */
export function getCookieConfig(maxAge?: number) {
  const mode = process.env.NODE_ENV || "prod";
  const config: CookieOptions =
    mode == "prod"
      ? {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          domain: ".tcompra.com",
          maxAge,
        }
      : { httpOnly: true, secure: false, sameSite: "lax", maxAge };
  return config;
}

export function getCsrfCookieConfig() {
  const mode = process.env.NODE_ENV || "prod";
  const config: CookieOptions =
    mode == "prod"
      ? {
          httpOnly: false,
          secure: true,
          sameSite: "none",
        }
      : { httpOnly: false, secure: false, sameSite: "lax" };
  return config;
}
