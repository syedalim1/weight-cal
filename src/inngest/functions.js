import { inngest } from "./client";
import { GoogleGenAI } from "@google/genai";
import prisma from "../lib/prisma";

// Use models.generateContent — the stable, well-documented API for single-turn requests
const GEMINI_MODEL = "gemini-2.5-flash";

export const analyzeFurnitureImage = inngest.createFunction(
  {
    id: "analyze-furniture-image",
    retries: 2, // AI calls shouldn't retry excessively
    triggers: [{ event: "app/analyze.furniture" }],
  },
  async ({ event, step }) => {
    const { jobId, image, dimensions } = event.data;

    // Helper to update status in DB
    const updateJobStatus = async (status, progress, result = null, error = null) => {
      const updateData = { status, progress };
      if (result) updateData.result = result;
      if (error) updateData.error = error;

      try {
        await prisma.aiJob.update({
          where: { id: jobId },
          data: updateData,
        });
      } catch (dbError) {
        console.error("[inngest] Error updating job status:", dbError);
      }
    };


    try {
      await step.run("set-preparing-status", async () => {
        console.log(`[inngest] Job ${jobId}: Starting analysis`);
        await updateJobStatus("processing", "Preparing AI request...");
      });

      const { systemPrompt, userPrompt } = await step.run("build-prompts", () => {
        const dimensionContext = buildDimensionContext(dimensions);
        return {
          systemPrompt: buildSystemPrompt(),
          userPrompt: buildUserPrompt(dimensionContext),
        };
      });

      await step.run("set-analyzing-status", async () => {
        await updateJobStatus("processing", "Sending request to Gemini...");
      });

      const result = await step.run("call-gemini", async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("Google Gemini API key not configured.");
        }
        console.log(`[inngest] Job ${jobId}: Calling Gemini (${GEMINI_MODEL})`);
        return await callGemini(image, systemPrompt, userPrompt, apiKey);
      });

      await step.run("set-parsing-status", async () => {
        await updateJobStatus("processing", "Parsing AI results...");
      });

      const parsed = await step.run("parse-results", () => {
        if (!result.content) {
          throw new Error("No response from AI model.");
        }
        console.log(`[inngest] Job ${jobId}: Parsing response (${result.content.length} chars)`);
        return {
          ...parseAIResponse(result.content),
          rawResponse: result.content,
          usage: result.usage,
        };
      });

      await step.run("set-completed-status", async () => {
        console.log(`[inngest] Job ${jobId}: Completed successfully`);
        await updateJobStatus("completed", "Analysis completed.", parsed);
      });

      return { success: true, jobId, parsed };
    } catch (error) {
      console.error(`[inngest] Job ${jobId}: Failed —`, error.message);
      await step.run("set-failed-status", async () => {
        await updateJobStatus("failed", "Failed during processing.", null, error.message || "Internal error");
      });
      throw error;
    }
  }
);

// --- Helpers ---

async function callGemini(image, systemPrompt, userPrompt, apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  
  let base64Data = image;
  let mimeType = "image/jpeg";
  
  if (image.startsWith("data:")) {
    const matches = image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    } else {
      base64Data = image.split(",")[1];
    }
  }

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: `${systemPrompt}\n\n${userPrompt}` },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
        ],
      },
    ],
  });

  return {
    content: response.text,
    usage: response.usageMetadata || null,
  };
}

function buildSystemPrompt() {
  return `You are an expert steel furniture fabricator with 20+ years of experience. You analyze images of steel furniture (chairs, tables, stools, racks, shelves, beds, etc.) and produce accurate pipe cutting lists.

Your job is to look at the furniture photo and the user-provided dimensions (if any), then identify EVERY structural member and generate a complete pipe cut list that a workshop could use to manufacture this furniture.

RULES:
1. Identify all structural members: legs, top frame, bottom frame, side frames, front supports, rear supports, seat supports, back supports, cross members, reinforcement bars, armrests, stretchers, and any additional visible pipes.
2. Estimate lengths realistically based on standard furniture dimensions if user dimensions are not provided.
3. Account for welding joints — subtract approximately 0.25 inches per joint from the raw dimension.
4. Estimate pipe sizes highly accurately. Differentiate between legs, side frames, seat supports, and back supports. Standard sizes like 1", 3/4", and 1/2" should be realistically chosen based on visual proportions. Use user-provided sizes ONLY if provided.
5. Always output a JSON object with the EXACT format specified below. Do NOT output anything other than this JSON.

OUTPUT FORMAT (respond with ONLY this JSON, no markdown code fences, no extra text):
{
  "furnitureType": "chair|table|stool|rack|shelf|bed|bench|other",
  "materialType": "ss|ms",
  "analysis": "A 2-3 sentence description of the furniture structure you see in the image.",
  "structuralMembers": [
    { "name": "Front Legs", "count": 2, "description": "Vertical front support legs" },
    { "name": "Rear Legs", "count": 2, "description": "Vertical rear legs extending up to form backrest" }
  ],
  "cutList": [
    {
      "name": "Front Legs",
      "shape": "square",
      "size": "1.0",
      "width": "",
      "height": "",
      "thickness": "1.5",
      "length": "18",
      "quantity": "2"
    }
  ]
}

IMPORTANT FIELD RULES:
- "materialType": determine if it is stainless steel (ss) if it looks like shiny, polished silver metal, or mild steel (ms) if it is painted, powder-coated, or matte.
- "shape": must be one of "square", "round", "rectangular"
- "size": pipe size in inches (used for square and round). Example: "1.0", "0.75", "1.5"
- "width" and "height": only used when shape is "rectangular", in inches. Leave as "" otherwise.
- "thickness": wall thickness in mm. Common values: 1.0, 1.2, 1.5, 2.0, 3.0
- "length": cut length in INCHES (not feet, not mm)
- "quantity": number of pieces needed as a string
- "name": descriptive name like "Front Legs", "Seat Frame - Front", "Back Support Horizontal", etc.

Be thorough. A typical steel chair has 12-20 pipe pieces. A table might have 8-15. Include EVERY structural member you can identify.`;
}

function buildDimensionContext(dimensions) {
  if (!dimensions)
    return "No specific dimensions provided. Analyze the image to automatically estimate standard furniture overall dimensions (height, width, depth) and meticulously estimate the most likely pipe sizes (e.g., 1\", 3/4\", 1/2\") and shape for each member based on visual proportions.";

  const parts = [];

  if (dimensions.overallHeight)
    parts.push(`Overall Height: ${dimensions.overallHeight} inches`);
  if (dimensions.overallWidth)
    parts.push(`Overall Width: ${dimensions.overallWidth} inches`);
  if (dimensions.overallDepth)
    parts.push(`Overall Depth: ${dimensions.overallDepth} inches`);
  if (dimensions.mainPipeSize)
    parts.push(
      `Main Pipe Size: ${dimensions.mainPipeSize}" ${dimensions.pipeShape || "square"} pipe`,
    );
  if (dimensions.sidePipeSize)
    parts.push(
      `Side Pipe Size: ${dimensions.sidePipeSize}" ${dimensions.pipeShape || "square"} pipe`,
    );
  if (dimensions.legPipeSize)
    parts.push(
      `Leg Pipe Size: ${dimensions.legPipeSize}" ${dimensions.pipeShape || "square"} pipe`,
    );
  if (dimensions.seatSupportPipeSize)
    parts.push(
      `Seat Support Pipe Size: ${dimensions.seatSupportPipeSize}" pipe`,
    );
  if (dimensions.backSupportPipeSize)
    parts.push(
      `Back Support Pipe Size: ${dimensions.backSupportPipeSize}" pipe`,
    );
  if (dimensions.materialType)
    parts.push(
      `Material: ${dimensions.materialType === "ms" ? "Mild Steel (MS)" : "Stainless Steel (SS)"}`,
    );
  if (dimensions.pipeShape) parts.push(`Pipe Shape: ${dimensions.pipeShape}`);
  if (dimensions.pipeThickness)
    parts.push(`Pipe Thickness: ${dimensions.pipeThickness} mm`);

  return parts.length > 0
    ? parts.join("\n")
    : "No specific dimensions provided. Analyze the image to automatically estimate standard furniture overall dimensions (height, width, depth) and meticulously estimate the most likely pipe sizes (e.g., 1\", 3/4\", 1/2\") and shape for each member based on visual proportions.";
}

function buildUserPrompt(dimensionContext) {
  return `Analyze this steel furniture image and generate a complete pipe cutting list.

USER-PROVIDED SPECIFICATIONS:
${dimensionContext}

If dimensions and pipe specifications are omitted above, you MUST automatically estimate all overall dimensions and individual pipe sizes for each structural member based on the visual proportions in the image.

Generate the complete JSON output with every structural pipe identified. Be thorough and realistic — your cut list should match what an experienced fabricator would prepare before manufacturing this exact piece of furniture.`;
}

function parseAIResponse(content) {
  try {
    let jsonStr = content.trim();

    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    if (parsed.cutList && Array.isArray(parsed.cutList)) {
      parsed.cutList = parsed.cutList.map((item, index) => ({
        id:
          Date.now().toString() +
          Math.random().toString(36).substr(2, 5) +
          index,
        name: item.name || `Part ${index + 1}`,
        shape: ["square", "round", "rectangular"].includes(item.shape)
          ? item.shape
          : "square",
        size: String(item.size || "1.0"),
        width: String(item.width || ""),
        height: String(item.height || ""),
        thickness: String(item.thickness || "1.5"),
        length: String(item.length || ""),
        quantity: String(item.quantity || "1"),
      }));
    }

    return {
      furnitureType: parsed.furnitureType || "unknown",
      materialType: parsed.materialType || "ms",
      analysis: parsed.analysis || "Analysis completed.",
      structuralMembers: parsed.structuralMembers || [],
      cutList: parsed.cutList || [],
    };
  } catch (error) {
    console.error("[inngest] Failed to parse AI response:", error);
    console.error("[inngest] Raw content:", content);
    return {
      furnitureType: "unknown",
      materialType: "ms",
      analysis: content,
      structuralMembers: [],
      cutList: [],
      parseError: true,
    };
  }
}
