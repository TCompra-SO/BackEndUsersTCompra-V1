import { Request, Response, Router } from "express";
import { getItems } from "../controllers/order";
import { checkJwt } from "../middleware/session";
const router = Router();
/** a esta ruta solo acceden personas activas jwt valido */

router.get('/', checkJwt, getItems);
export { router };
