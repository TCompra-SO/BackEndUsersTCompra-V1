import { categories, parentCategories } from "../utils/Categories";

export const getCategories = () => {
  try {
    // Unimos categories con parentCategories agregando parentName
    const categoriesWithParentName = categories.map((category) => {
      const parent = parentCategories.find(
        (parentCategory) => parentCategory.id === category.parentId
      );

      return {
        ...category,
        parentName: parent ? parent.value : null,
      };
    });

    return {
      success: true,
      data: categoriesWithParentName,
    };
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    return {
      success: false,
      error: "No se pudieron obtener las categorías.",
    };
  }
};
