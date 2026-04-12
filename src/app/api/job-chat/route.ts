import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/job-chat
 * Send a message (user or agent). Supports file attachments and special types.
 * Body: { jobId, sender, message, msgType?, metadata?, authToken? }
 */
export async function POST(request: NextRequest) {
  try {
    const { jobId, sender, message, msgType, metadata, authToken } = await request.json();

    if (!jobId || !sender || !message) {
      return NextResponse.json({ error: "Missing jobId, sender, or message" }, { status: 400 });
    }
    if (!["user", "agent"].includes(sender)) {
      return NextResponse.json({ error: "sender must be 'user' or 'agent'" }, { status: 400 });
    }

    // Auth: agent calls must include a valid runtime token
    if (sender === "agent") {
      const expectedToken = process.env.AGENT_RUNTIME_TOKEN;
      if (expectedToken && authToken !== expectedToken) {
        return NextResponse.json({ error: "Unauthorized: invalid agent token" }, { status: 401 });
      }
    }

    const { error } = await supabase.from("job_messages").insert({
      job_id: Number(jobId),
      sender,
      message: String(message),
      msg_type: msgType || "text",
      metadata: metadata || {},
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/job-chat?jobId=X&since=ISO_timestamp
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  const since = searchParams.get("since");

  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

  let query = supabase
    .from("job_messages")
    .select("*")
    .eq("job_id", Number(jobId))
    .order("created_at", { ascending: true });

  if (since) query = query.gt("created_at", since);

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
