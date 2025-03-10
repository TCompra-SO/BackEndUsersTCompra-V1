import { sign, verify } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "token.01010101";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh.01010101";

const generateToken = async (uid: string) => {
  const accessToken = sign({ uid }, JWT_SECRET, { expiresIn: "2m" });
  const refreshToken = sign({ uid }, JWT_REFRESH_SECRET, { expiresIn: "7d" });

  return { accessToken, refreshToken };
};

const verifyToken = async (token: string) => {
  try {
    return verify(token, JWT_SECRET) as { uid: string };
  } catch (error) {
    console.error("Error al verificar access token:", error);
    return null;
  }
};

const generateRefreshAccessToken = async (refreshToken: string) => {
  try {
    const decoded = verify(refreshToken, JWT_REFRESH_SECRET) as { uid: string };
    const newAccessToken = sign({ uid: decoded.uid }, JWT_SECRET, {
      expiresIn: "2h",
    });

    return { success: true, accessToken: newAccessToken };
  } catch (error) {
    console.error("Error al generar nuevo access token:", error);
    return { success: false, msg: "Refresh Token inválido" };
  }
};

const verifyRefreshAccessToken = async (token: string) => {
  try {
    return verify(token, JWT_REFRESH_SECRET) as { uid: string };
  } catch (error) {
    console.error("Error al verificar refresh token:", error);
    return { success: false, msg: "Refresh Token inválido" };
  }
};

export {
  generateToken,
  verifyToken,
  generateRefreshAccessToken,
  verifyRefreshAccessToken,
};
