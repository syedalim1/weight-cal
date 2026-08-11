"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function saveFurnitureModel(data) {
  try {
    const newModel = await prisma.furnitureModel.create({
      data: {
        modelName: data.modelName,
        materialType: data.materialType,
        referenceDimensions: data.referenceDimensions,
        cutList: data.cutList,
      },
    });
    
    // Revalidate the path so the sidebar updates
    revalidatePath("/calculator");
    
    return { success: true, model: newModel };
  } catch (error) {
    console.error("Failed to save furniture model:", error);
    return { success: false, error: error?.message || "Failed to save model." };
  }
}

export async function getFurnitureModels() {
  try {
    const models = await prisma.furnitureModel.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, models };
  } catch (error) {
    console.error("Failed to fetch furniture models:", error);
    return { success: false, error: error?.message || "Failed to fetch models." };
  }
}

export async function updateFurnitureModel(id, data) {
  try {
    const updatedModel = await prisma.furnitureModel.update({
      where: { id },
      data: {
        modelName: data.modelName,
        materialType: data.materialType,
        referenceDimensions: data.referenceDimensions,
        cutList: data.cutList,
      },
    });

    revalidatePath("/calculator");
    
    return { success: true, model: updatedModel };
  } catch (error) {
    console.error("Failed to update furniture model:", error);
    return { success: false, error: error?.message || "Failed to update model." };
  }
}
