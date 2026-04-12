import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import { supabase } from "@/lib/supabase";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

// Don't generate this at build time — it requires live RPC calls
export const dynamic = "force-dynamic";
export const revalidate = 0;

const AGENT_REGISTRY_ABI = [
  "function totalAgents() view returns (uint256)",
  "function getAgentProfile(uint256 agentId) view returns (tuple(address owner, address agentWallet, bytes eciesPublicKey, bytes32 capabilityHash, string capabilityCID, string profileCID, uint256 overallScore, uint256 totalJobsCompleted, uint256 totalJobsAttempted, uint256 totalEarningsWei, uint256 defaultRate, uint256 createdAt, bool isActive))",
  "function getAgentSkills(uint256 agentId) view returns (bytes32[])",
];

const RPC_URL = "https://evmrpc-testnet.0g.ai";
const CONTRACT_ADDRESS = CONTRACT_ADDRESSES.AgentRegistry;

function decodeManifest(capabilityCID: string): {
  llmProvider: string;
  llmModel: string;
  runtimeType: string;
  toolsCount: number;
} | null {
  if (!capabilityCID) return null;

  // CID format: "pm:<base64>" or "sh:<base64>"
  const match = capabilityCID.match(/^(pm|sh):(.+)$/);
  if (!match) return null;

  const [, prefix, base64] = match;

  try {
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    const manifest = JSON.parse(jsonStr);

    const platformConfig = manifest.platformConfig || {};
    const llmProvider = platformConfig.llmProvider || "unknown";
    const llmModel = platformConfig.model || "unknown";
    const tools = platformConfig.tools || [];
    const toolsCount = Array.isArray(tools) ? tools.length : 0;

    return {
      llmProvider,
      llmModel,
      runtimeType: prefix === "pm" ? "platform" : "self-hosted",
      toolsCount,
    };
  } catch {
    return null;
  }
}

async function syncAgentStats(): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, AGENT_REGISTRY_ABI, provider);

  const totalAgentsBig = await contract.totalAgents();
  const totalAgents = Number(totalAgentsBig);

  if (totalAgents === 0) {
    return { synced: 0, errors: [] };
  }

  for (let i = 0; i < totalAgents; i++) {
    try {
      const profile = await contract.getAgentProfile(i);

      const decoded = decodeManifest(profile.capabilityCID);

      const llmProvider = decoded?.llmProvider ?? "unknown";
      const llmModel = decoded?.llmModel ?? "unknown";
      const runtimeType = decoded?.runtimeType ?? "self-hosted";
      const toolsCount = decoded?.toolsCount ?? 0;

      const tasksCompleted = Number(profile.totalJobsCompleted ?? 0);
      const totalJobsAttempted = Number(profile.totalJobsAttempted ?? 0);
      const successRate = totalJobsAttempted > 0
        ? Math.round((tasksCompleted / totalJobsAttempted) * 100)
        : 0;

      // Get skills count from on-chain
      let skillsCount = 0;
      try {
        const skills = await contract.getAgentSkills(i);
        skillsCount = skills?.length ?? 0;
      } catch {
        skillsCount = 0;
      }

      // Upsert — only include columns that exist in the live schema
      const statsData: Record<string, unknown> = {
        agent_id: i,
        llm_provider: llmProvider,
        llm_model: llmModel,
        runtime_type: runtimeType,
        self_improvement_rate: 0,
        tasks_completed: tasksCompleted,
        success_rate: successRate,
        skills_count: skillsCount,
        tools_count: toolsCount,
      };

      const { error: upsertError } = await supabase
        .from("agent_proposal_stats")
        .upsert(statsData, { onConflict: "agent_id" });

      if (upsertError) {
        errors.push(`Agent ${i}: Supabase upsert failed - ${upsertError.message}`);
        console.error(`[sync] Agent ${i} upsert error:`, upsertError);
      } else {
        synced++;
      }
    } catch (err) {
      const msg = `Agent ${i}: ${err instanceof Error ? err.message : String(err)}`;
      errors.push(msg);
      console.error(`[sync] Agent ${i} failed:`, err);
    }
  }

  return { synced, errors };
}

export async function GET(_request: NextRequest) {
  try {
    const result = await syncAgentStats();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[sync] Fatal error:", err);
    return NextResponse.json(
      { synced: 0, errors: [`Fatal: ${err instanceof Error ? err.message : String(err)}`] },
      { status: 500 }
    );
  }
}

export async function POST(_request: NextRequest) {
  try {
    const result = await syncAgentStats();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[sync] Fatal error:", err);
    return NextResponse.json(
      { synced: 0, errors: [`Fatal: ${err instanceof Error ? err.message : String(err)}`] },
      { status: 500 }
    );
  }
}
