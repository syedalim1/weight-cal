import { inngest } from "./client";
import prisma from "@/lib/prisma";

export const generateFurnitureCutlist = inngest.createFunction(
  {
    id: "generate-furniture-cutlist",
    retries: 0,
    triggers: [{ event: "ai/generate.cutlist" }],
  },
  async ({ event, step }) => {
    const { modelId, dimensions, preset, dimensionUnit } = event.data;

    const parsedJson = await step.run("call-openrouter-and-parse", async () => {
      const dbModel = await prisma.furnitureModel.findUnique({
        where: { id: modelId },
      });
      if (!dbModel || !dbModel.imageUrl) {
        throw new Error("Model or image not found in database.");
      }
      const base64Image = dbModel.imageUrl;

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error("OpenRouter API Key not configured.");
      }

      const systemPrompt = `You are a Master Steel Furniture Fabricator and Expert Quantity Surveyor with 20+ years of experience.
Your task is to analyze an image of steel furniture, use the provided reference dimensions, and reverse-engineer a highly accurate, production-ready pipe cut-list.

USER INPUTS:
- Overall Height: ${dimensions?.overallHeight || "not specified"} ${dimensionUnit}
- Seat Height: ${dimensions?.seatHeight || "not specified"} ${dimensionUnit}
- Width: ${dimensions?.width || "not specified"} ${dimensionUnit}
- Length/Depth: ${dimensions?.length || "not specified"} ${dimensionUnit}
- Material Preset: ${preset || "not specified"}
- Active Unit: ${dimensionUnit}

CRITICAL FABRICATION RULES FOR 99% ACCURACY:
1. Angle & Cross Pipes: For diagonal braces, angled backrests, or X-shaped legs, you MUST use trigonometric principles (like the Pythagorean theorem) based on the width/height they span. Do not guess. The diagonal is always longer than the straight sides.
2. Intersections & Deductions: When a horizontal seat frame sits ON TOP of the legs, you MUST deduct the frame's pipe thickness from the total seat height to get the true leg cut length.
3. Standard Market Sizes: Snap pipe sizes to standard industrial sizes. If unit is 'mm', use sizes like 19, 20, 25, 32, 50x25. If unit is 'inch', use 0.75, 1.0, 1.25, 2x1.
4. Unit Strictness: ALL 'size' and 'length' values MUST strictly be in ${dimensionUnit}. Do not mix mm and inches.
5. Symmetrical Quantities: Ensure quantities reflect real-world physics (e.g., chairs usually have 4 legs, 2 side supports).

OUTPUT FORMAT:
Output ONLY a raw, valid JSON array. STRICTLY NO markdown formatting like \`\`\`json. STRICTLY NO conversational text before or after the JSON.

Each object in the array MUST contain exactly these keys:
- "partName": string (e.g., "Front Legs", "Diagonal Cross Brace", "Seat Frame (Width)")
- "shape": string (strictly one of: "square", "round", "rectangle")
- "size": string (e.g., if mm: "25x25", "25". if inch: "1x1", "1")
- "thickness_gauge": string (e.g., "18", "16", "20")
- "fabrication_math": string (Briefly explain your math for this part. e.g., "Seat height 450 - frame 25 = 425" or "Hypotenuse of 400 width and 400 height = 565")
- "length": number (The final precise calculated cut length in ${dimensionUnit}. MUST be a number, not a string).
- "qty": number (integer)

Analyze the 3D geometry carefully, perform the math, and generate the JSON.`;

      const payload = {
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this furniture and generate the cut list."
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ]
      };

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Steel Furniture Calculator",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API Error (${response.status}): ${errorText.slice(0, 300)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();

      if (!content) {
        throw new Error("AI returned empty response.");
      }

      let parsed;
      try {
        const cleaned = content.replace(/^```(json)?|```$/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (parseError) {
        throw new Error("AI response was not valid JSON: " + content.slice(0, 300));
      }
      return parsed;
    });

    await step.run("update-database", async () => {
      // Map AI response to the structure expected by the frontend
      const mappedRows = parsedJson.map(item => ({
        id: Math.random().toString(36).substr(2, 9),
        partName: item.partName || "",
        shape: item.shape || "square",
        size: item.size || "",
        thicknessUnit: "gauge",
        thickness: item.thickness_gauge || "",
        lengthUnit: dimensionUnit,
        length: item.length?.toString() || "",
        quantity: item.qty || 1,
      }));

      await prisma.furnitureModel.update({
        where: { id: modelId },
        data: {
          cutList: mappedRows,
          status: "completed",
        },
      });
    });

    
    return { success: true, modelId };
  }
);
