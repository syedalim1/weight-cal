import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";
import { supabase } from "../../../lib/supabase";

export async function POST(request) {
  try {
    const body = await request.json();
    const { image, dimensions } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided." },
        { status: 400 },
      );
    }

    let jobId = null;

    if (supabase) {
      // Create a job record in Supabase
      const { data, error } = await supabase
        .from("ai_jobs")
        .insert([{ status: "pending", progress: "Uploading image..." }])
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        return NextResponse.json(
          { error: "Database error while creating job." },
          { status: 500 }
        );
      }
      jobId = data.id;
    } else {
      // Fallback if supabase isn't configured, although tracking won't work well
      jobId = "temp-" + Date.now().toString();
    }

    // Trigger the Inngest background workflow
    await inngest.send({
      name: "app/analyze.furniture",
      data: {
        jobId,
        image,
        dimensions
      }
    });

    // Return the Job ID immediately so the frontend can start tracking
    return NextResponse.json({
      success: true,
      jobId
    });

  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
