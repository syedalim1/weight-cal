"use server";

// Note: AI analysis is handled via the /api/analyze/direct API route.
// This file contains Inngest-based trigger functions for background processing.

import prisma from "@/lib/prisma";
import { inngest } from "@/inngest/client";

export async function triggerAiGeneration(payload) {
  try {
    const newModel = await prisma.furnitureModel.create({
      data: {
        modelName: "AI Generated Model",
        materialType: "ms",
        referenceDimensions: payload.dimensions || {},
        cutList: [],
        imageUrl: payload.image,
        status: "generating",
      },
    });

    await inngest.send({
      name: "ai/generate.cutlist",
      data: {
        modelId: newModel.id,
        dimensions: payload.dimensions,
        preset: payload.preset,
        dimensionUnit: payload.dimensionUnit,
      },
    });

    return { success: true, modelId: newModel.id };
  } catch (error) {
    console.error("Failed to trigger AI generation:", error);
    return { success: false, error: error.message };
  }
}

export async function getAiGenerationStatus(modelId) {
  try {
    const model = await prisma.furnitureModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      return { success: false, error: "Model not found." };
    }

    if (model.status === "generating") {
      return { success: true, status: "generating" };
    }

    return {
      success: true,
      status: "completed",
      cutList: model.cutList,
    };
  } catch (error) {
    console.error("Failed to get AI status:", error);
    return { success: false, error: error.message };
  }
}
