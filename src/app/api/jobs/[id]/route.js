import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Job ID required" }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("ai_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching job:", error);
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job: data });
  } catch (error) {
    console.error("Job API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
