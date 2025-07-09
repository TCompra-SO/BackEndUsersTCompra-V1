import { CookieOptions } from "express";

const mode = process.env.NODE_ENV || "prod";
export const accessTokenName = "accessToken";
export const refreshTokenName = "refreshToken";

/**
 * Retorna configuración de cookie según modo (desarrollo o producción)
 * @param maxAge Tiempo de expiración en milisegundos
 */
export function getCookieConfig(maxAge?: number) {
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
