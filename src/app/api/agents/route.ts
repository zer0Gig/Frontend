import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";
import { supabase } from "@/lib/supabase";

const AGENT_REGISTRY_ABI = [
  "function totalAgents() view returns (uint256)",
  "function getAgentProfile(uint256 agentId) view returns (tuple(address owner, address agentWallet, bytes eciesPublicKey, bytes32 capabilityHash, string capabilityCID, string profileCID, uint256 overallScore, uint256 totalJobsCompleted, uint256 totalJobsAttempted, uint256 totalEarningsWei, uint256 defaultRate, uint256 createdAt, bool isActive))",
];

const RPC_URL = "https://evmrpc-testnet.0g.ai";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AgentProfile {
  agentId: number;
  owner: string;
  agentWallet: string;
  capabilityCID: string;
  profileCID: string;
  overallScore: number;
  totalJobsCompleted: number;
  totalJobsAttempted: number;
  totalEarningsWei: string;
  defaultRate: string;
  createdAt: number;
  isActive: boolean;
  displayName: string | null;
  tags: string[] | null;
}

function decodeCapabilitySkills(capabilityCID: string): string[] {
  try {
    if (!capabilityCID) return [];
    let base64 = capabilityCID;
    if (capabilityCID.includes(":")) {
      base64 = capabilityCID.split(":")[1];
    }
    const decoded = JSON.parse(atob(base64));
    return decoded.skills || [];
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.AgentRegistry,
      AGENT_REGISTRY_ABI,
      provider
    );

    const totalAgentsBig = await contract.totalAgents();
    const totalAgents = Number(totalAgentsBig);

    const maxToQuery = totalAgents + 2;
    const agents: AgentProfile[] = [];

    for (let i = 0; i < maxToQuery; i++) {
      try {
        const profile = await contract.getAgentProfile(i);

        if (profile[0] === "0x0000000000000000000000000000000000000000") {
          continue;
        }

        const skillIds = decodeCapabilitySkills(profile[4] as string);

        agents.push({
          agentId: i,
          owner: profile[0] as string,
          agentWallet: profile[1] as string,
          capabilityCID: profile[4] as string,
          profileCID: profile[5] as string,
          overallScore: Number(profile[6]),
          totalJobsCompleted: Number(profile[7]),
          totalJobsAttempted: Number(profile[8]),
          totalEarningsWei: (profile[9] as bigint).toString(),
          defaultRate: (profile[10] as bigint).toString(),
          createdAt: Number(profile[11]),
          isActive: profile[12] as boolean,
          displayName: null,
          tags: skillIds,
        });
      } catch {
        continue;
      }
    }

    const agentIds = agents.map(a => a.agentId);
    const { data: profiles } = await supabase
      .from("agent_profiles")
      .select("agent_id, display_name, tags")
      .in("agent_id", agentIds.length > 0 ? agentIds : [0]);

    const profileMap = new Map<number, { displayName: string | null; tags: string[] | null }>();
    (profiles || []).forEach((p: { agent_id: number; display_name: string | null; tags: string[] | null }) => {
      profileMap.set(p.agent_id, { displayName: p.display_name, tags: p.tags });
    });

    const result = agents.map(a => {
      const supabaseProfile = profileMap.get(a.agentId);
      return {
        ...a,
        displayName: supabaseProfile?.displayName || null,
        tags: supabaseProfile?.tags || a.tags,
      };
    });

    return NextResponse.json({
      agents: result,
      total: totalAgents,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}