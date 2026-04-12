import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(SB_URL, SB_SERVICE_KEY);
}

/**
 * POST /api/telegram-link/profile
 * Stores the Telegram chatId in agent_profiles.metadata for the given owner.
 * Uses service role key to bypass RLS — only called from authenticated browser sessions.
 *
 * Body: { ownerAddress: string, chatId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { ownerAddress, chatId } = await request.json();
    if (!ownerAddress || !chatId) {
      return NextResponse.json({ error: "Missing ownerAddress or chatId" }, { status: 400 });
    }

    const admin = getAdminClient();
    const { error } = await admin
      .from("agent_profiles")
      .update({
        metadata: { telegramChatId: chatId },
        updated_at: new Date().toISOString(),
      })
      .eq("owner_address", ownerAddress.toLowerCase());

    if (error) {
      console.warn("[telegram-link/profile] update error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, chatId });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
