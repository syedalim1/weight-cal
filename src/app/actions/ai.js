"use server";

export async function analyzeWithOpenRouter(image, dimensions, preset) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return { success: false, error: "OpenRouter API Key not configured." };
    }

    const systemPrompt = `You are an expert steel furniture fabricator and estimator.
Your task is to analyze the provided image of steel furniture, along with the reference dimensions and material preset, and generate a complete and precise pipe cut-list.

Reference Dimensions provided by user:
Overall Height: ${dimensions.overallHeight} mm
Seat Height: ${dimensions.seatHeight} mm
Width: ${dimensions.width} mm
Length: ${dimensions.length} mm
Material Preset: ${preset}

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
                url: image // Assuming this is a base64 data URL
              }
            }
          ]
        }
      ]
    };

    // Fetch with a 60-second timeout to avoid hanging
    let response;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);

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
      console.error("OpenRouter fetch error:", fetchErr);
      if (fetchErr.name === "AbortError") {
        return { success: false, error: "OpenRouter request timed out (60s). Try a smaller image or try again." };
      }
      return { success: false, error: `Network error connecting to OpenRouter: ${fetchErr.message}` };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      return { success: false, error: `OpenRouter API Error (${response.status}): ${errorText.slice(0, 200)}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return { success: false, error: "AI returned empty response." };
    }

    // Try to parse the JSON
    let parsedJson;
    try {
      // In case AI adds markdown despite instructions, try to clean it
      const cleaned = content.replace(/^```(json)?|```$/g, '').trim();
      parsedJson = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI output as JSON:", content);
      return { success: false, error: "AI response was not valid JSON. Raw: " + content.slice(0, 200) };
    }

    return { success: true, cutList: parsedJson };

  } catch (error) {
    console.error("AI Action Error:", error);
    return { success: false, error: `AI Analysis Error: ${error.message || "Internal server error."}` };
  }
}
