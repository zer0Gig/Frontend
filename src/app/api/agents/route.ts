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

    console.log(`[agents] totalAgents on contract = ${totalAgents}`);

    // Query up to totalAgents + 1 to catch any off-by-one issues
    const maxToQuery = totalAgents + 2;
    console.log(`[agents] Will query agents 0 to ${maxToQuery - 1} (${maxToQuery} total)`);

    const agents: AgentProfile[] = [];

    for (let i = 0; i < maxToQuery; i++) {
      console.log(`[agents] Querying agent ${i}...`);
      try {
        const profile = await contract.getAgentProfile(i);

        // Skip if owner is zero address (deleted/unregistered agent)
        if (profile[0] === "0x0000000000000000000000000000000000000000") {
          console.log(`[agents] Skipping agent ${i} - zero owner address`);
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
          console.log(`[agents] Agent ${i} does not exist on-chain`);
        } else {
          console.log(`[agents] ERROR fetching agent ${i}: ${errorMsg}`);
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