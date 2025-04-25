import { Request, Response } from "express";
import { PlanService } from "../services/planServices";

export const createPlanController = async (req: Request, res: Response) => {
  try {
    const responseUser = await PlanService.createPlan(req.body);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en createPlanController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getAllPlansController = async (req: Request, res: Response) => {
  try {
    const responseUser = await PlanService.getAllPlans();
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getAllPlansController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const getPlanByIdController = async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const responseUser = await PlanService.getPlanById(planId);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getPlanByIdController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};

export const registerUserPlanController = async (
  req: Request,
  res: Response
) => {
  try {
    const { userId, planId } = req.body;
    const responseUser = await PlanService.registerUserPlan(userId, planId);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en registerUserPlanController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del servidor.",
    });
  }
};
