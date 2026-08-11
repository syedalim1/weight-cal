import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client";
import prisma from "../../../lib/prisma";

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

    // Create a job record in the database
    const job = await prisma.aiJob.create({
      data: {
        status: "pending",
        progress: "Uploading image...",
      },
    });

    const jobId = job.id;

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
