import { Request, Response, response } from "express";
import { subUserServices } from "../services/subUserServices";

const registerSubUserController = async ({ body }: Request, res: Response) => {
  const { uid, dni, address, cityID, phone, email, typeID } = body;
  try {
    const responseUser = await subUserServices.NewSubUser(
      uid,
      dni,
      address,
      cityID,
      phone,
      email,
      typeID
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else if (responseUser) {
      res.status(responseUser.code).send(responseUser.error);
    } else {
      res.status(500).send({
        success: false,
        msg: "Error interno del servidor, respuesta inválida.",
      });
    }
  } catch (error) {
    console.error("Error en RegisterController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const getSubUserController = async (req: Request, res: Response) => {
  const { uid } = req.params;
  try {
    const responseUser = await subUserServices.getProfileSubUser(uid);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser.data);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getSubUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const updateSubUserController = async ({ body }: Request, res: Response) => {
  const data = body;
  try {
    const responseUser = await subUserServices.updateSubUser(data);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en updateUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const changeStatusController = async ({ body }: Request, res: Response) => {
  const { uid, status } = body;
  try {
    const responseUser = await subUserServices.changeStatus(uid, status);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en changeStatusController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const changeRoleController = async ({ body }: Request, res: Response) => {
  const { uid, typeID } = body;
  try {
    const responseUser = await subUserServices.changeRole(uid, typeID);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en changeRolController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const getSubUsersByEntity = async (req: Request, res: Response) => {
  const { uid, page, limit } = req.params;
  try {
    const responseUser = await subUserServices.getSubUsers(
      uid,
      Number(page),
      Number(limit)
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getSubUsersByEntityController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

const searchSubUserController = async (req: Request, res: Response) => {
  const { entityID, page, pageSize, fieldName, orderType, keyWords } = req.body;
  try {
    const responseUser = await subUserServices.searchSubUser(
      entityID,
      Number(page),
      Number(pageSize),
      keyWords,
      fieldName,
      Number(orderType)
    );
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en searchSubUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export {
  registerSubUserController,
  getSubUserController,
  updateSubUserController,
  changeStatusController,
  changeRoleController,
  getSubUsersByEntity,
  searchSubUserController,
};
