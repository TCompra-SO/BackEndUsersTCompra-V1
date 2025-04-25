import { PlanI } from "../interfaces/plan.interface";
import PlanModel from "../models/planModel";
import { AuthServices } from "./authServices";
import { TypeEntity } from "../types/globalTypes";
import CompanyModel from "../models/companyModel";
import UserModel from "../models/userModel";

export class PlanService {
  static createPlan = async (
    planData: Omit<PlanI, "uid" | "createdAt" | "updatedAt">
  ) => {
    try {
      const newPlan = new PlanModel(planData);
      await newPlan.save();
      return {
        success: true,
        code: 200,
        data: newPlan,
      };
    } catch (error) {
      console.error("Error inesperado al agregar el Plan:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado en el Servidor.",
        },
      };
    }
  };

  static getPlanById = async (planId: string) => {
    try {
      const plan = await PlanModel.findOne({ uid: planId }).exec();
      if (!plan) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "El Plan no existe",
          },
        };
      }
      return {
        success: true,
        code: 200,
        data: plan,
      };
    } catch (error) {
      console.error("Error inesperado al obtener el Plan:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado en el Servidor.",
        },
      };
    }
  };

  static getAllPlans = async () => {
    try {
      const plans = await PlanModel.find().exec();
      return {
        success: true,
        code: 200,
        data: plans,
      };
    } catch (error) {
      console.error("Error inesperado al obtener los Planes:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado en el Servidor.",
        },
      };
    }
  };

  static registerUserPlan = async (userId: string, planId: string) => {
    try {
      let typeEntity: any;
      let entityModel;
      const planVerify = await this.getPlanById(planId);

      const userData = await AuthServices.getDataBaseUser(userId);

      if (userData.data?.[0].auth_users) {
        typeEntity = userData.data?.[0].auth_users.typeEntity;
      } else {
        typeEntity = userData.data?.[0].typeEntity;
      }

      if (typeEntity === TypeEntity.SUBUSER) {
        return {
          success: false,
          code: 400,
          res: {
            msg: "El tipo de usuario no permite registrarse en el Plan",
          },
        };
      }
      if (userData.code === 403) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "El usuario no existe",
          },
        };
      }

      if (typeEntity === TypeEntity.COMPANY) {
        entityModel = CompanyModel;
      } else {
        entityModel = UserModel;
      }

      const updateResult = await entityModel.updateOne(
        { uid: userId },
        { $set: { planID: planId } }
      );

      if (updateResult.modifiedCount === 0) {
        return {
          success: false,
          code: 409,
          error: {
            msg: "No se pudo actualizar el plan.",
          },
        };
      }

      // if(userData)
      if (planVerify.success) {
      } else {
        return {
          success: false,
          code: 401,
          error: {
            msg: "El plan no existe",
          },
        };
      }
      return {
        success: true,
        code: 200,
        msg: "se registro el plan",
      };
    } catch (error) {
      console.error(
        "Error inesperado al registrar el Plan con el usuario:",
        error
      );
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error inesperado en el Servidor.",
        },
      };
    }
  };
}
