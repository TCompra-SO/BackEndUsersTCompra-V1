import { sign, verify } from "jsonwebtoken";
import { getToken } from "./authStore";

const JWT_SECRET = process.env.JWT_SECRET || "token.01010101";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh.01010101";

// Generar tokens de acceso y actualización
const generateToken = async (id: string) => {
  const accessToken = sign({ uid: id }, JWT_SECRET, {
    expiresIn: "2h",
  }); // Usar `uid` en lugar de `id`
  const refreshToken = sign({ uid: id }, JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  }); // Usar `uid` en lugar de `id`

  return { accessToken, refreshToken };
};

// Verificar token de acceso
const verifyToken = (token: string) => {
  try {
    return verify(token, JWT_SECRET) as { uid: string }; // Asegurar que el payload tenga `uid`
  } catch (error) {
    return null;
  }
};

// Generar un nuevo token de acceso usando el refresh token
const generateRefreshAccessToken = (refreshToken: string) => {
  try {
    const decoded = verify(refreshToken, JWT_REFRESH_SECRET) as { uid: string }; // Asegurar que el payload tenga `uid`
    const newAccessToken = sign({ uid: decoded.uid }, JWT_SECRET, {
      expiresIn: "2h",
    });

    return { success: true, accessToken: newAccessToken };
  } catch (error) {
    return { success: false, msg: "Refresh Token inválido" };
  }
};

// Verificar refresh token
const verifyRefreshAccessToken = async (token: string) => {
  try {
    return verify(token, JWT_REFRESH_SECRET) as { uid: string }; // Asegurar que el payload tenga `uid`
  } catch (error) {
    return null;
  }
};

export {
  generateToken,
  verifyToken,
  generateRefreshAccessToken,
  verifyRefreshAccessToken,
};
