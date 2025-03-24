import { Request, Response, response } from "express";
import { subUserServices } from "../services/subUserServices";
import { boolean } from "joi";
import { subUserRoomName } from "../utils/Globals";
import { io } from "../server";
import { TypeSocket } from "../types/globalTypes";

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

      if (responseUser.res?.uid) {
        const subUser = await subUserServices.getProfileSubUser(
          responseUser.res.uid
        );
        if (subUser.success)
          io.to(`${subUserRoomName}${uid}`).emit("updateRoom", {
            dataPack: subUser,
            typeSocket: TypeSocket.CREATE,
            key: responseUser.res.uid,
            userId: uid,
          });
      }
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
      if (responseUser.res?.uid)
        io.to(`${subUserRoomName}${responseUser.res.uid}`).emit("updateRoom", {
          dataPack: {
            data: [{ active_account: status }],
          },
          typeSocket: TypeSocket.UPDATE_FIELD,
          key: uid,
          userId: responseUser.res.uid,
        });
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
      if (responseUser.res?.companyUid)
        io.to(`${subUserRoomName}${responseUser.res.companyUid}`).emit(
          "updateRoom",
          {
            dataPack: {
              data: [{ typeID: typeID }],
            },
            typeSocket: TypeSocket.UPDATE_FIELD,
            key: uid,
            userId: responseUser.res.companyUid,
          }
        );
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
  const {
    userId,
    page,
    pageSize,
    fieldName,
    orderType,
    keyWords,
    filterColumn,
    filterData,
  } = req.body;
  try {
    const responseUser = await subUserServices.searchSubUser(
      userId,
      Number(page),
      Number(pageSize),
      keyWords,
      fieldName,
      Number(orderType),
      filterColumn,
      filterData
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

const sendCounterUpdateController = async (req: Request, res: Response) => {
  try {
    for (const entity of Object.keys(req.body)) {
      for (const subUser of Object.keys(req.body[entity])) {
        io.to(`${subUserRoomName}${entity}`).emit("updateRoom", {
          dataPack: {
            data: [req.body[entity][subUser]],
          },
          typeSocket: TypeSocket.UPDATE_FIELD,
          key: subUser,
          userId: entity,
        });
      }
    }
    res.status(200).send();
  } catch (error) {
    console.error("Error en sendCounterUpdateController", error);
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
  sendCounterUpdateController,
};
