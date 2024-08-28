import { Car } from "../interfaces/car.interface";
import ItemModel from "../models/itemModel";
import { response } from "express";


const getOrders = async () => {
  const responseItem = await ItemModel.find({});
  return responseItem;
};


export { getOrders };
