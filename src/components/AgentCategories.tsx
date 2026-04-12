"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useAllAgents } from "@/hooks/useAllAgents";
import { SKILL_LABELS } from "@/hooks/useAgentManagement";
import { SKILL_IDS } from "@/lib/contracts";
import { useMemo } from "react";
import IsoCategoryIcon from "./IsoCategoryIcon";

const CATEGORIES = [
  { label: "Coding Agents", skillKey: "solidityDev" as keyof typeof SKILL_IDS, color: "from-cyan-500/10 to-blue-500/10", border: "border-cyan-500/20 hover:border-cyan-500/40" },
  { label: "Writing Agents", skillKey: "contentWriting" as keyof typeof SKILL_IDS, color: "from-purple-500/10 to-pink-500/10", border: "border-purple-500/20 hover:border-purple-500/40" },
  { label: "Data Analysis", skillKey: "dataAnalysis" as keyof typeof SKILL_IDS, color: "from-emerald-500/10 to-teal-500/10", border: "border-emerald-500/20 hover:border-emerald-500/40" },
  { label: "Creative Agents", skillKey: "imageGeneration" as keyof typeof SKILL_IDS, color: "from-amber-500/10 to-orange-500/10", border: "border-amber-500/20 hover:border-amber-500/40" },
  { label: "Research Agents", skillKey: "webSearch" as keyof typeof SKILL_IDS, color: "from-blue-500/10 to-indigo-500/10", border: "border-blue-500/20 hover:border-blue-500/40" },
  { label: "Code Execution", skillKey: "codeExecution" as keyof typeof SKILL_IDS, color: "from-rose-500/10 to-red-500/10", border: "border-rose-500/20 hover:border-rose-500/40" },
];

export default function AgentCategories() {
  const { agents } = useAllAgents();

  // Count agents per skill from on-chain data
  const skillCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(cat => { counts[cat.skillKey] = 0; });

    agents.forEach(agent => {
      agent.skillIds.forEach((skillId: string) => {
        CATEGORIES.forEach(cat => {
          if (skillId === SKILL_IDS[cat.skillKey]) {
            counts[cat.skillKey] = (counts[cat.skillKey] || 0) + 1;
          }
        });
      });
    });

    return counts;
  }, [agents]);

  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.04] blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] rounded-full bg-purple-500/[0.04] blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2
            className="text-2xl md:text-3xl font-medium mb-3"
            style={{
              background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Browse by Capability
          </h2>
          <p className="text-white/40 text-[14px] max-w-md mx-auto">
            Find the right AI agent for any task. Each agent has verified on-chain skills and reputation.
          </p>
        </motion.div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CATEGORIES.map((cat, i) => {
            const skillLabel = SKILL_LABELS[SKILL_IDS[cat.skillKey]] || cat.label;
            const count = skillCounts[cat.skillKey] || 0;

            return (
              <motion.div
                key={cat.skillKey}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <Link href={`/marketplace?skill=${encodeURIComponent(skillLabel)}`}>
                  <div className={`group rounded-2xl bg-gradient-to-br ${cat.color} border ${cat.border} p-5 text-center transition-all duration-300 hover:scale-[1.03] cursor-pointer`}>
                    {/* 3D Isometric Icon */}
                    <div className="h-[120px] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                      <IsoCategoryIcon category={cat.label} skillKey={cat.skillKey} size={112} />
                    </div>
                    {/* Label */}
                    <h3 className="text-white text-[13px] font-medium mb-1">{cat.label}</h3>
                    {/* Count (from on-chain data) */}
                    <p className="text-white/40 text-[12px]">
                      {count > 0 ? `${count} agent${count > 1 ? "s" : ""}` : "Coming soon"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
