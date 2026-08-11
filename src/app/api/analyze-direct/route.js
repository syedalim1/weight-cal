import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60s for AI response

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, dimensions, preset } = body;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided." },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OpenRouter API Key not configured on server." },
        { status: 500 },
      );
    }

    const systemPrompt = `You are an expert steel furniture fabricator and estimator.
Your task is to analyze the provided image of steel furniture, along with the reference dimensions and material preset, and generate a complete and precise pipe cut-list.

Reference Dimensions provided by user:
Overall Height: ${dimensions?.overallHeight || "not specified"} mm
Seat Height: ${dimensions?.seatHeight || "not specified"} mm
Width: ${dimensions?.width || "not specified"} mm
Length: ${dimensions?.length || "not specified"} mm
Material Preset: ${preset || "not specified"}

Output Requirements:
You must output ONLY a raw JSON array of objects representing the cut-list. DO NOT include markdown formatting like \`\`\`json. DO NOT include any conversational text.

Each object in the array MUST have exactly these keys:
- "partName" (string, e.g., "Front Legs", "Backrest Support")
- "shape" (string, strictly one of: "square", "round", "rectangle")
- "size_mm" (string, e.g., "25x25", "20", "40x20")
- "thickness_gauge" (string, e.g., "18", "16", "20")
- "length_mm" (string, e.g., "450", "900")
- "qty" (number, integer)

Ensure the lengths mathematically make sense based on the overall dimensions provided.`;

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
                url: image
              }
            }
          ]
        }
      ]
    };

    // Fetch with a 60-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Steel Furniture Calculator",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
    } catch (fetchErr) {
      clearTimeout(timeout);
      console.error("OpenRouter fetch error:", fetchErr);
      if (fetchErr.name === "AbortError") {
        return NextResponse.json(
          { success: false, error: "OpenRouter request timed out (60s). Try a smaller image." },
          { status: 504 },
        );
      }
      return NextResponse.json(
        { success: false, error: `Network error: ${fetchErr.message}` },
        { status: 502 },
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      return NextResponse.json(
        { success: false, error: `OpenRouter API Error (${response.status}): ${errorText.slice(0, 300)}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { success: false, error: "AI returned empty response." },
        { status: 502 },
      );
    }

    // Parse the JSON response
    let parsedJson;
    try {
      const cleaned = content.replace(/^```(json)?|```$/g, '').trim();
      parsedJson = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI output as JSON:", content);
      return NextResponse.json(
        { success: false, error: "AI response was not valid JSON.", raw: content.slice(0, 300) },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, cutList: parsedJson });

  } catch (error) {
    console.error("Analyze Direct API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
