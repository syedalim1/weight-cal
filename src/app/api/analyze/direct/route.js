import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { image, dimensions, preset, dimensionUnit = "mm" } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: "OpenRouter API Key not configured." }, { status: 500 });
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
- "fabrication_math": string (Briefly explain your math for this part.)
- "length": number (The final precise calculated cut length in ${dimensionUnit}. MUST be a number, not a string).
- "qty": number (integer)

Analyze the 3D geometry carefully, perform the math, and generate the JSON.`;

    const payload = {
      model: "google/gemini-3.7-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this furniture and generate the cut list." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Steel Furniture Calculator",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: `OpenRouter API Error (${response.status}): ${errorText.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json({ success: false, error: "AI returned empty response." }, { status: 502 });
    }

    let parsedJson;
    try {
      const cleaned = content.replace(/^```(json)?|```$/g, "").trim();
      parsedJson = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI output:", content);
      return NextResponse.json(
        { success: false, error: "AI response was not valid JSON. Raw: " + content.slice(0, 300) },
        { status: 502 }
      );
    }

    const mappedRows = parsedJson.map((item) => ({
      id: Math.random().toString(36).substr(2, 9),
      partName: item.partName || "",
      shape: item.shape || "square",
      size: item.size || item.size_mm || "",
      thicknessUnit: "gauge",
      thickness: item.thickness_gauge || "",
      lengthUnit: dimensionUnit,
      length: item.length?.toString() || "",
      quantity: item.qty || 1,
    }));

    return NextResponse.json({ success: true, cutList: mappedRows });
  } catch (error) {
    console.error("AI Analysis Error:", error);
    if (error.name === "AbortError") {
      return NextResponse.json({ success: false, error: "Request timed out (120s). Try a smaller image." }, { status: 504 });
    }
    return NextResponse.json({ success: false, error: error.message || "Internal server error." }, { status: 500 });
  }
}
