import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getAdminClient() {
  return createClient(SB_URL, SB_SERVICE_KEY);
}

/**
 * POST /api/telegram-link
 * Called by the Telegram bot when a user sends /start.
 * Stores the chatId in telegram_links for polling-based linking.
 *
 * Body: { chatId: string, telegramUserId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const { chatId, telegramUserId } = await request.json();
    if (!chatId) return NextResponse.json({ error: "Missing chatId" }, { status: 400 });

    await supabase
      .from("telegram_links")
      .upsert(
        { chat_id: String(chatId), telegram_user_id: telegramUserId, linked_at: new Date().toISOString() },
        { onConflict: "chat_id" }
      );

    return NextResponse.json({ success: true, chatId });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/telegram-link?chatId=XXX
 * - With chatId: check if that specific chatId is linked.
 * - Without chatId: return the most recently linked entry (for status polling in UI).
 *
 * GET /api/telegram-link?owner=0xXXX
 * - Returns the most recent chatId linked to this owner address (runtime fallback).
 *   The runtime uses this when agent_skills.config.chatId is empty (late Telegram pairing).
 *   Uses service role key to bypass RLS.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const chatId = url.searchParams.get("chatId");
  const owner = url.searchParams.get("owner");

  // Runtime fallback: look up chatId by owner address (service role = bypass RLS)
  if (owner) {
    const admin = getAdminClient();
      const { data } = await admin
      .from("agent_profiles")
      .select("metadata")
      .eq("owner_address", owner.toLowerCase())
      .single();
    const chatIdFromProfile = data?.metadata?.telegramChatId ?? null;
    return NextResponse.json({ chatId: chatIdFromProfile });
  }

  if (chatId) {
    const { data } = await supabase
      .from("telegram_links")
      .select("chat_id, linked_at")
      .eq("chat_id", chatId)
      .single();
    return NextResponse.json({ linked: !!data, chatId: data?.chat_id, linkedAt: data?.linked_at });
  }

  // No chatId — return most recent link (used by ConnectTelegramButton status polling)
  const { data } = await supabase
    .from("telegram_links")
    .select("chat_id, linked_at")
    .order("linked_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({ linked: !!data, chatId: data?.chat_id, linkedAt: data?.linked_at });
}
