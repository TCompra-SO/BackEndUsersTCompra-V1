import { Request, Response, response } from "express";
import { handleHttp } from "../utils/error.handle";
import {
  insertCar,
  getCars,
  getCar,
  updateCar,
  deleteCar,
} from "../services/itemServices";

const getItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await getCar(id);
    res.send(response);
  } catch (e) {
    handleHttp(res, "ERROR_GET_ITEM");
  }
};

const getItems = async (req: Request, res: Response) => {
  try {
    const response = await getCars();
    if (response.length === 0) {
      // Si no hay registros, envía un mensaje de respuesta
      return res.status(404).send({ message: "No se encontraron registros." });
    } else {
      res.send(response);
    }
  } catch (e) {
    handleHttp(res, "ERROR_GET_ITEMS");
  }
};

const postItem = async ({ body }: Request, res: Response) => {
  try {
    const responseItem = await insertCar(body);
    res.send(responseItem);
  } catch (e) {
    handleHttp(res, "ERROR_POST_ITEM", e);
  }
};

const updateItem = async ({ params, body }: Request, res: Response) => {
  try {
    const { id } = params;
    const response = await updateCar(id, body);
    res.send(response);
  } catch (e) {
    handleHttp(res, "ERROR_UPDATE_ITEM");
  }
};

const deleteItem = async ({ params }: Request, res: Response) => {
  try {
    const { id } = params;
    const response = await deleteCar(id);
    res.send(response);
  } catch (e) {
    handleHttp(res, "ERROR_DELETE_ITEM");
  }
};

export { getItem, getItems, postItem, updateItem, deleteItem };
