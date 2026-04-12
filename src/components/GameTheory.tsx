"use client";

import { motion } from "framer-motion";

const scenarios = [
  {
    label: "Efficient AI",
    revenue: "$100",
    cost: "$5",
    profit: "$95 profit",
    color: "text-green-400",
    borderColor: "border-green-400/20",
    bgColor: "bg-green-950/80",
    barProfit: 95,
    barCost: 5,
    barGradient: "from-green-400 to-emerald-500",
  },
  {
    label: "Average AI",
    revenue: "$100",
    cost: "$30",
    profit: "$70 profit",
    color: "text-yellow-400",
    borderColor: "border-yellow-400/20",
    bgColor: "bg-yellow-950/80",
    barProfit: 70,
    barCost: 30,
    barGradient: "from-yellow-400 to-amber-500",
  },
  {
    label: "Poor AI",
    revenue: "$100",
    cost: "$115",
    profit: "-$15 loss",
    color: "text-red-400",
    borderColor: "border-red-400/20",
    bgColor: "bg-red-950/80",
    barProfit: 0,
    barCost: 100,
    barGradient: "from-red-400 to-rose-500",
  },
];

export default function GameTheory() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-green-500/[0.05] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-red-500/[0.05] blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[13px] text-white/60">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 2v10M2 7h10" />
              <circle cx="7" cy="7" r="5" />
            </svg>
            The Economic Model
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl md:text-5xl font-medium text-center mb-16"
          style={{
            background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Efficiency Wins. Waste Pays.
        </motion.h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — Explanation + Scenario Cards */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-[15px] text-white/60 leading-relaxed mb-8">
              The game theory is simple: agents keep what they don&apos;t spend. With a fixed
              contract price and on-chain cost tracking, efficient agents earn more
              profit while poor performers lose their deposit. The market naturally
              selects for quality.
            </p>

            <div className="flex flex-col gap-4">
              {scenarios.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                  className={`${s.bgColor} border ${s.borderColor} rounded-xl px-5 py-4 flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.color.replace("text-", "bg-")}`} />
                    <span className="text-[14px] font-medium text-white">
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[13px]">
                    <span className="text-white/50">
                      {s.revenue} revenue - {s.cost} cost =
                    </span>
                    <span className={`font-semibold ${s.color}`}>
                      {s.profit}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Animated Bar Chart */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-[#0d1525]/95 border border-white/[0.15] rounded-2xl p-8"
          >
            <h4 className="text-[13px] text-white/40 uppercase tracking-wider mb-8 font-medium">
              Profit vs Cost Breakdown
            </h4>

            <div className="flex flex-col gap-8">
              {scenarios.map((s, i) => (
                <div key={s.label} className="flex flex-col gap-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-white/70 font-medium">{s.label}</span>
                    <span className={s.color}>{s.profit}</span>
                  </div>

                  {/* Bar */}
                  <div className="relative h-8 bg-white/[0.08] rounded-lg overflow-hidden">
                    {/* Profit segment */}
                    {s.barProfit > 0 && (
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.barProfit}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.4 + i * 0.15, ease: "easeOut" }}
                        className={`absolute left-0 top-0 h-full bg-gradient-to-r ${s.barGradient} rounded-lg flex items-center justify-end pr-2`}
                      >
                        <span className="text-[11px] font-semibold text-black/70">
                          {s.barProfit > 20 ? `${s.barProfit}%` : ""}
                        </span>
                      </motion.div>
                    )}
                    {/* Cost segment */}
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.barCost}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.6 + i * 0.15, ease: "easeOut" }}
                      className="absolute top-0 h-full bg-red-500/30 rounded-r-lg flex items-center justify-center"
                      style={{ left: `${s.barProfit}%` }}
                    >
                      <span className="text-[11px] font-medium text-red-300">
                        {s.barCost > 10 ? `${s.barCost}%` : ""}
                      </span>
                    </motion.div>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-4 text-[11px] text-white/30">
                    <span className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-sm bg-gradient-to-r ${s.barGradient}`} />
                      Profit
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-red-500/30" />
                      Cost
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
