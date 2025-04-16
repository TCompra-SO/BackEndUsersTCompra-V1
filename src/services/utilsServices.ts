import { UtilData } from "../utils/UtilData";
import { UtilDataType } from "../types/globalTypes";
import { RequestExt } from "../interfaces/req-ext";
import mongoose, { Mongoose } from "mongoose";
import dbConnect from "../database/mongo";
import { categories } from "../utils/Categories";

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

    // Consultar los productos filtrados por rubros y stateID
    const products = await productsCollection
      .aggregate([
        {
          $match: {
            entityID: { $ne: entityID },
            categoryID: { $in: rubros },
            stateID: 1,
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
          },
        },
      ])
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Consultar los servicios filtrados por rubros y stateID
    const services = await servicesCollection
      .aggregate([
        {
          $match: {
            entityID: { $ne: entityID },
            categoryID: { $in: rubros },
            stateID: 1,
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
          },
        },
      ])
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    let i = 0;

    let category: any = new Array(rubros.length);
    console.log(categories.find((r) => r.id === 1));
    while (i < rubros.length) {
      category[i] = categories.find((r) => r.id === rubros[i]);

      i++;
    }
    console.log(category);
    console.log(products);
    i = 0;
    products.forEach((product) => {
      const cat = category.find((r: any) => r.id === product.categoryID);
      product.categoryName = cat?.value || "Categoría desconocida";
    });
    console.log(products);
    // Consultar las liquidaciones filtradas por rubros
    const liquidations = await liquidationsCollection
      .aggregate([
        {
          $match: {
            entityID: { $ne: entityID },
            categoryID: { $in: rubros },
            stateID: 1,
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
          },
        },
      ])
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    // Unir los productos y servicios, ordenados por createdAt y obtener solo los primeros 10 registros
    const requerimientos = [...products, ...services]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(({ uid, name, entityID, entityName }) => ({
        uid,
        name,
        entityID,
        entityName,
      }));

    // Devolver los resultados
    return {
      success: true,
      code: 200,
      data: {
        latestRequerimientos: requerimientos,
        liquidations: liquidations.map(
          ({ uid, name, entityID, entityName }) => ({
            uid,
            name,
            entityID,
            entityName,
          })
        ),
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
