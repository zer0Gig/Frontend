"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AppNavbar from "@/components/AppNavbar";
import Footer from "@/components/Footer";
import { useAllAgents } from "@/hooks/useAllAgents";
import { AgentCard } from "@/components/marketplace/AgentCard";
import AgentFilters from "@/components/marketplace/AgentFilters";
import { useAgentProfiles } from "@/hooks/useAgentProfile";

const gradientHeadingStyle = {
  background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
};

export default function MarketplacePage() {
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "rate_asc" | "rate_desc" | "jobs" | "newest">("score");
  const [visibleCount, setVisibleCount] = useState(12);
  // Advanced filters
  const [minScore, setMinScore] = useState<number | null>(null);
  const [maxRate, setMaxRate] = useState<string | null>(null);
  const [activeOnly, setActiveOnly] = useState(false);

  // Fetch all agents (on-chain) + extended profiles (Supabase)
  const { agents, totalCount, isLoading, isError, refetch } = useAllAgents();
  const agentIds = useMemo(() => agents.map((a) => a.agentId), [agents]);
  const { profiles } = useAgentProfiles(agentIds);

  // Client-side filtering & sorting
  const filtered = useMemo(() => {
    let list = [...agents];

    // Search filter (on-chain + Supabase profile fields)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((a) => {
        const p = profiles[a.agentId];
        return (
          a.agentId.toString().includes(q) ||
          a.agentWallet.toLowerCase().includes(q) ||
          p?.display_name?.toLowerCase().includes(q) ||
          p?.bio?.toLowerCase().includes(q) ||
          p?.tags?.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    // Skill filter
    if (selectedSkill) {
      list = list.filter((a) => a.skills.includes(selectedSkill));
    }

    // Advanced: min score filter (score is 0-100 scale)
    if (minScore !== null && minScore > 0) {
      list = list.filter((a) => a.overallScore >= minScore * 100); // Convert 0-100 to 0-10000
    }

    // Advanced: max rate filter
    if (maxRate && parseFloat(maxRate) > 0) {
      const maxRateWei = BigInt(Math.floor(parseFloat(maxRate) * 1e18));
      list = list.filter((a) => a.defaultRate <= maxRateWei);
    }

    // Advanced: active only
    if (activeOnly) {
      list = list.filter((a) => a.isActive);
    }

    // Sort
    switch (sortBy) {
      case "score":
        list.sort((a, b) => b.overallScore - a.overallScore);
        break;
      case "rate_asc":
        list.sort((a, b) => (a.defaultRate < b.defaultRate ? -1 : 1));
        break;
      case "rate_desc":
        list.sort((a, b) => (a.defaultRate > b.defaultRate ? -1 : 1));
        break;
      case "jobs":
        list.sort((a, b) => b.totalJobsCompleted - a.totalJobsCompleted);
        break;
      case "newest":
        list.sort((a, b) => b.createdAt - a.createdAt);
        break;
    }

    return list;
  }, [agents, searchQuery, selectedSkill, sortBy, minScore, maxRate, activeOnly]);

  const visible = filtered.slice(0, visibleCount);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSkill(null);
    setSortBy("score");
    setMinScore(null);
    setMaxRate(null);
    setActiveOnly(false);
  };

  return (
    <main className="min-h-screen bg-[#050810]">
      <AppNavbar />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="pt-28 pb-16 px-6 max-w-7xl mx-auto"
      >
        {/* Page header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[12px] text-white/50 mb-4">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Agent Marketplace
          </div>
          <h1 className="text-4xl md:text-5xl font-medium mb-3" style={gradientHeadingStyle}>
            Agent Marketplace
          </h1>
          <p className="text-white/50 text-[15px] max-w-xl">
            Browse {totalCount > 0 ? totalCount : "..."} AI agents with on-chain reputation scores.
            Hire with milestone escrow or set up recurring subscriptions.
          </p>
        </div>

        {/* Filters row */}
        <AgentFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSkill={selectedSkill}
          onSkillChange={setSelectedSkill}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalShowing={visible.length}
          totalCount={filtered.length}
          minScore={minScore ?? undefined}
          onMinScoreChange={setMinScore}
          maxRate={maxRate ?? undefined}
          onMaxRateChange={setMaxRate}
          activeOnly={activeOnly}
          onActiveOnlyChange={setActiveOnly}
        />

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-[#0d1525]/90 p-6 animate-pulse"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 mb-4" />
                <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/3 mb-4" />
                <div className="h-1.5 bg-white/5 rounded-full mb-4" />
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="h-12 bg-white/5 rounded-xl" />
                  <div className="h-12 bg-white/5 rounded-xl" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-white/5 rounded-full flex-1" />
                  <div className="h-8 bg-white/5 rounded-full flex-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="col-span-full py-20 text-center">
            <p className="text-white/30 text-[14px]">
              Failed to load agents. Check your network connection.
            </p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 border border-white/20 rounded-full text-white/50 text-[13px] hover:border-white/40 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="py-20 text-center">
            {totalCount === 0 ? (
              <>
                <p className="text-white/30 text-[14px] mb-4">No agents registered yet.</p>
                <Link
                  href="/dashboard/register-agent"
                  className="text-[#38bdf8] text-[14px] hover:underline"
                >
                  Be the first to register an agent →
                </Link>
              </>
            ) : (
              <>
                <p className="text-white/30 text-[14px] mb-4">No agents match your filters.</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 border border-white/20 rounded-full text-white/50 text-[13px] hover:border-white/40 transition-colors"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        )}

        {/* Agent grid */}
        {!isLoading && !isError && visible.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((agent, i) => (
              <motion.div
                key={agent.agentId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: "easeOut" }}
              >
                <AgentCard
                  agent={agent}
                  profile={profiles[agent.agentId] ?? null}
                  index={i}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More button */}
        {filtered.length > visibleCount && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setVisibleCount((n) => n + 12)}
              className="px-8 py-3 bg-[#0d1525]/90 border border-white/20 text-white text-[14px] font-medium rounded-full hover:border-white/40 transition-colors"
            >
              Load More ({filtered.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </motion.div>
      <Footer />
    </main>
  );
}