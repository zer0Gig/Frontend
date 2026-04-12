import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/milestone-approval
 * Called by the frontend when the user approves a milestone.
 * Body: { jobId, milestoneIndex, approvedBy?, feedback?, authToken? }
 */
export async function POST(request: NextRequest) {
  try {
    const { jobId, milestoneIndex, approvedBy, feedback, authToken } = await request.json();

    if (jobId === undefined || milestoneIndex === undefined) {
      return NextResponse.json(
        { error: "Missing jobId or milestoneIndex" },
        { status: 400 }
      );
    }

    if (typeof jobId !== "number" || typeof milestoneIndex !== "number") {
      return NextResponse.json(
        { error: "jobId and milestoneIndex must be numbers" },
        { status: 400 }
      );
    }

    // Optional: validate authToken for future agent-authenticated approvals
    if (authToken) {
      const expectedToken = process.env.AGENT_RUNTIME_TOKEN;
      if (expectedToken && authToken !== expectedToken) {
        return NextResponse.json(
          { error: "Unauthorized: invalid agent token" },
          { status: 401 }
        );
      }
    }

    const { error } = await supabase.from("milestone_approvals").upsert(
      {
        job_id: jobId,
        milestone_index: milestoneIndex,
        approved_by: approvedBy || null,
        feedback: feedback || null,
      },
      { onConflict: "job_id,milestone_index" }
    );

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/milestone-approval?jobId=X&milestoneIndex=Y
 * Polled by the agent runtime to check if the user approved the milestone.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const milestoneIndex = searchParams.get("milestoneIndex");

  if (!jobId || !milestoneIndex) {
    return NextResponse.json(
      { error: "Missing jobId or milestoneIndex" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("milestone_approvals")
    .select("*")
    .eq("job_id", Number(jobId))
    .eq("milestone_index", Number(milestoneIndex))
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ approved: !!data, approval: data ?? null });
}
