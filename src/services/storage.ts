import { Storage } from "../interfaces/storage.interface";
import StorageModel from "../models/storageModel";

const registerUpload = async ({ fileName, idUser, path }: Storage) => {
  console.log(path);
  const responseItem = await StorageModel.create({ fileName, idUser, path });
  return responseItem;
};

export { registerUpload };
