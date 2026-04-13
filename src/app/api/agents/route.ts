import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESSES } from "@/lib/contracts";

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
}

export async function GET() {
  const errors: string[] = [];

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESSES.AgentRegistry,
      AGENT_REGISTRY_ABI,
      provider
    );

    const totalAgentsBig = await contract.totalAgents();
    const totalAgents = Number(totalAgentsBig);

    console.log(`[agents] totalAgents returned: ${totalAgents} (type: ${typeof totalAgents})`);
    console.log(`[agents] BigInt conversion: ${BigInt(totalAgents)}`);
    console.log(`[agents] Number conversion: ${Number(totalAgents)}`);

    if (totalAgents === 0) {
      return NextResponse.json({ agents: [], total: 0 });
    }

    const agentCount = Number(totalAgents);
    console.log(`[agents] Will query agents 0 to ${agentCount - 1} (${agentCount} total)`);

    const agents: AgentProfile[] = [];

    // First, try to query agent 9 directly (user's newest agent)
    console.log(`[agents] Attempting direct query for agent 9...`);
    try {
      const profile9 = await contract.getAgentProfile(9);
      if (profile9[0] !== "0x0000000000000000000000000000000000000000") {
        console.log(`[agents] Agent 9 FOUND on-chain! Owner: ${profile9[0]}`);
        agents.push({
          agentId: 9,
          owner: profile9[0],
          agentWallet: profile9[1],
          capabilityCID: profile9[4],
          profileCID: profile9[5],
          overallScore: Number(profile9[6]),
          totalJobsCompleted: Number(profile9[7]),
          totalJobsAttempted: Number(profile9[8]),
          totalEarningsWei: profile9[9].toString(),
          defaultRate: profile9[10].toString(),
          createdAt: Number(profile9[11]),
          isActive: profile9[12],
        });
      } else {
        console.log(`[agents] Agent 9 exists but has zero owner address`);
      }
    } catch (err) {
      console.log(`[agents] Agent 9 not found on-chain: ${err instanceof Error ? err.message : String(err)}`);
    }

    for (let i = 0; i < agentCount; i++) {
      console.log(`[agents] Querying agent ${i}...`);
      try {
        const profile = await contract.getAgentProfile(i);

        // Skip if owner is zero address (deleted/unregistered agent)
        if (profile[0] === "0x0000000000000000000000000000000000000000") {
          console.log(`[agents] Skipping agent ${i} - zero owner address (deleted?)`);
          continue;
        }

        agents.push({
          agentId: i,
          owner: profile[0],
          agentWallet: profile[1],
          capabilityCID: profile[4],
          profileCID: profile[5],
          overallScore: Number(profile[6]),
          totalJobsCompleted: Number(profile[7]),
          totalJobsAttempted: Number(profile[8]),
          totalEarningsWei: profile[9].toString(),
          defaultRate: profile[10].toString(),
          createdAt: Number(profile[11]),
          isActive: profile[12],
        });
        console.log(`[agents] Successfully fetched agent ${i}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        if (errorMsg.includes("agent does not exist")) {
          console.log(`[agents] Skipping agent ${i} - does not exist`);
        } else {
          console.log(`[agents] ERROR fetching agent ${i}: ${errorMsg}`);
          console.error(`[agents] Failed to fetch agent ${i}:`, err);
        }
      }
    }

    console.log(`[agents] Total fetched: ${agents.length}, errors: ${errors.length}`);

    return NextResponse.json({ 
      agents, 
      total: totalAgents,
      errors: errors.length > 0 ? errors : undefined 
    });
  } catch (err) {
    console.error("[agents] Fatal error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
