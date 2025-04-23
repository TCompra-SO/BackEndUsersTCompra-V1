import { UtilData } from "../utils/UtilData";
import { UtilDataType } from "../types/globalTypes";
import { RequestExt } from "../interfaces/req-ext";
import mongoose, { Mongoose } from "mongoose";
import dbConnect from "../database/mongo";
import { categories } from "../utils/Categories";
import { array } from "joi";

export const getUtilData = (type: UtilDataType) => {
  try {
    // Accede a la primera entrada de UtilData y busca por el parámetro 'type'
    const result = UtilData[0][type];

    if (result) {
      return {
        success: true,
        data: result,
      };
    } else {
      return {
        success: false,
        error: `No se encontraron datos para el tipo: ${type}`,
      };
    }
  } catch (error) {
    console.error("Error al obtener los datos de utilidad:", error);
    return {
      success: false,
      error: "No se pudieron obtener los datos de utilidad.",
    };
  }
};

export const getLastRecords = async (entityID: string, rubros: [number]) => {
  try {
    const productsCollection = mongoose.connection.collection("products");
    const servicesCollection = mongoose.connection.collection("services");
    const liquidationsCollection =
      mongoose.connection.collection("liquidations");
    let products = new Array();
    let services = new Array();
    let cont = 0;

    const now = new Date();

    // Inicio de hoy
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    // Fin de mañana
    const tomorrowEnd = new Date();
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // Consultar los productos filtrados por rubros y stateID
    while (cont < rubros.length) {
      products[cont] = await productsCollection
        .aggregate([
          {
            $match: {
              entityID: { $ne: entityID },
              categoryID: rubros[cont],
              stateID: 1,
              $or: [
                { completion_date: { $lt: todayStart } }, // Antes de hoy
                { completion_date: { $gt: tomorrowEnd } }, // Después de mañana
                { completion_date: { $exists: false } }, // O sin fecha
              ],
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: "companys",
              localField: "entityID",
              foreignField: "uid",
              as: "companyData",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "entityID",
              foreignField: "uid",
              as: "userData",
            },
          },
          {
            $addFields: {
              entityName: {
                $cond: {
                  if: { $gt: [{ $size: "$companyData" }, 0] },
                  then: { $arrayElemAt: ["$companyData.name", 0] },
                  else: { $arrayElemAt: ["$userData.name", 0] },
                },
              },
              entityID: {
                $cond: {
                  if: { $gt: [{ $size: "$companyData" }, 0] },
                  then: { $arrayElemAt: ["$companyData.uid", 0] },
                  else: { $arrayElemAt: ["$userData.uid", 0] },
                },
              },
            },
          },
          {
            $project: {
              uid: 1,
              name: 1,
              createdAt: 1,
              entityID: 1,
              entityName: 1,
              categoryID: 1,
              completion_date: 1,
            },
          },
        ])
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

      // Consultar los servicios filtrados por rubros y stateID
      services[cont] = await servicesCollection
        .aggregate([
          {
            $match: {
              entityID: { $ne: entityID },
              categoryID: rubros[cont],
              stateID: 1,
              $or: [
                { completion_date: { $lt: todayStart } }, // Antes de hoy
                { completion_date: { $gt: tomorrowEnd } }, // Después de mañana
                { completion_date: { $exists: false } }, // O sin fecha
              ],
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: "companys",
              localField: "entityID",
              foreignField: "uid",
              as: "companyData",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "entityID",
              foreignField: "uid",
              as: "userData",
            },
          },
          {
            $addFields: {
              entityName: {
                $cond: {
                  if: { $gt: [{ $size: "$companyData" }, 0] },
                  then: { $arrayElemAt: ["$companyData.name", 0] },
                  else: { $arrayElemAt: ["$userData.name", 0] },
                },
              },
              entityID: {
                $cond: {
                  if: { $gt: [{ $size: "$companyData" }, 0] },
                  then: { $arrayElemAt: ["$companyData.uid", 0] },
                  else: { $arrayElemAt: ["$userData.uid", 0] },
                },
              },
            },
          },
          {
            $project: {
              uid: 1,
              name: 1,
              createdAt: 1,
              entityID: 1,
              entityName: 1,
              categoryID: 1,
              completion_date: 1,
            },
          },
        ])
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

      cont++;
    }

    const requeriments: any = services.map((servGroup, index) => {
      const prodGroup = products[index] || [];
      const merged = [...servGroup, ...prodGroup];

      // Ordenar por fecha de creación (más reciente primero)
      return merged.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    });

    let i = 0;

    let category: any = new Array(rubros.length);
    // console.log(categories.find((r) => r.id === 1));
    while (i < rubros.length) {
      category[i] = categories.find((r) => r.id === rubros[i]);

      i++;
    }

    i = 0;

    requeriments.forEach((grupo: any) => {
      grupo.forEach((item: any) => {
        const match = category.find((c: any) => c?.id === item.categoryID);
        item.categoryName = match?.value || "Desconocido"; // por si no encuentra match
      });
    });

    // Consultar las liquidaciones filtradas por rubros

    let liquidations = new Array();
    cont = 0;
    while (cont < rubros.length) {
      liquidations[cont] = await liquidationsCollection
        .aggregate([
          {
            $match: {
              entityID: { $ne: entityID },
              categoryID: rubros[cont],
              stateID: 1,
              $or: [
                { completion_date: { $lt: todayStart } }, // Antes de hoy
                { completion_date: { $gt: tomorrowEnd } }, // Después de mañana
                { completion_date: { $exists: false } }, // O sin fecha
              ],
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $limit: 10,
          },
          {
            $lookup: {
              from: "companys",
              localField: "entityID",
              foreignField: "uid",
              as: "companyData",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "entityID",
              foreignField: "uid",
              as: "userData",
            },
          },
          {
            $addFields: {
              entityName: {
                $cond: {
                  if: { $gt: [{ $size: "$companyData" }, 0] },
                  then: { $arrayElemAt: ["$companyData.name", 0] },
                  else: { $arrayElemAt: ["$userData.name", 0] },
                },
              },
              entityID: {
                $cond: {
                  if: { $gt: [{ $size: "$companyData" }, 0] },
                  then: { $arrayElemAt: ["$companyData.uid", 0] },
                  else: { $arrayElemAt: ["$userData.uid", 0] },
                },
              },
            },
          },
          {
            $project: {
              uid: 1,
              name: 1,
              createdAt: 1,
              entityID: 1,
              entityName: 1,
              categoryID: 1,
              completion_date: 1,
            },
          },
        ])
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

      cont++;
    }

    liquidations.forEach((grupo: any) => {
      grupo.forEach((item: any) => {
        const match = category.find((c: any) => c?.id === item.categoryID);
        item.categoryName = match?.value || "Desconocido"; // por si no encuentra match
      });
    });

    // Devolver los resultados
    return {
      success: true,
      code: 200,
      data: {
        entityID,
        requeriments: requeriments,
        liquidations: liquidations,
      },
    };
  } catch (error) {
    return {
      success: false,
      code: 500,
      error: {
        msg: "Ha ocurrido un error en el Servidor",
      },
    };
  }
};
