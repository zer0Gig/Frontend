export const MOCK_AGENTS = [
  {
    id: "1",
    name: "CodeBot-v3",
    type: "CODER",
    tier: "S-Tier",
    efficiency: 94,
    rate: "0.01 OG",
    jobs: 127,
    specialty: "Solidity auditing, React, TypeScript",
  },
  {
    id: "2",
    name: "WriteGenius",
    type: "WRITER",
    tier: "A-Tier",
    efficiency: 87,
    rate: "0.008 OG",
    jobs: 89,
    specialty: "Technical docs, Whitepapers",
  },
  {
    id: "3",
    name: "DataMind",
    type: "ANALYST",
    tier: "B-Tier",
    efficiency: 76,
    rate: "0.012 OG",
    jobs: 45,
    specialty: "Data pipelines, ML inference",
  },
];

export const MOCK_JOBS = [
  {
    jobId: 1,
    title: "Smart Contract Audit",
    status: 2,
    client: "0x1234567890123456789012345678901234567890",
    agent: "CodeBot-v3",
    agentId: 1,
    agentWallet: "0xabcdef1234567890abcdef1234567890abcdef12",
    jobDataCID: "QmX7krz3W7YtYv1W4fT2hK9Lm5Np6Qs8Rt2Yu3AbCdEf",
    skillId: "0x0000000000000000000000000000000000000000000000000000000000000001",
    totalBudgetWei: "50000000000000000",
    releasedWei: "33000000000000000",
    milestoneCount: 3,
    currentMilestone: 2,
  },
];

export function getMockAgents() {
  return MOCK_AGENTS;
}

export function getMockJobs() {
  return MOCK_JOBS;
}

export const MOCK_SUBSCRIPTIONS = [
  {
    subscriptionId: 1,
    agentId: 1,
    agentName: "CodeBot-v3",
    client: "0x1234567890123456789012345678901234567890",
    clientAddress: "0x1234567890123456789012345678901234567890",
    status: 1,
    checkInRate: "1000000000000000",
    alertRate: "1000000000000000",
    lastCheckIn: Math.floor(Date.now() / 1000) - 3600,
    nextCheckIn: Math.floor(Date.now() / 1000) + 86400,
    totalDrained: "50000000000000000",
    balance: "450000000000000000",
    intervalSeconds: 86400,
    intervalMode: 1,
    gracePeriodEnds: Math.floor(Date.now() / 1000) + 86400,
    gracePeriodSeconds: 3600,
    proposedInterval: 86400,
    x402Enabled: false,
    x402VerificationMode: 0,
    webhookUrl: "https://example.com/webhook",
    taskDescription: "Weekly smart contract review and audit",
  },
];
