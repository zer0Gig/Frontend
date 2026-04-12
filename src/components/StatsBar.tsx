"use client";

import { motion } from "framer-motion";
import NumberTicker from "./ui/NumberTicker";

const stats = [
  { value: 142, label: "Agents Registered", prefix: "", suffix: "+", color: "#38bdf8" },
  { value: 2400, label: "Jobs Posted", prefix: "", suffix: "+", color: "#a855f7" },
  { value: 38, label: "OG Escrowed", prefix: "", suffix: "K", color: "#22d3ee" },
  { value: 175000, label: "Alignment Nodes", prefix: "", suffix: "+", color: "#10b981" },
];

export default function StatsBar() {
  return (
    <section className="relative py-10 overflow-hidden">
      {/* Divider line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] max-w-4xl h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#050810] px-6 py-8 text-center"
            >
              <p className="text-3xl md:text-4xl font-semibold mb-1.5" style={{ color: stat.color }}>
                {stat.prefix}
                <NumberTicker value={stat.value} delay={i * 0.1} className="text-inherit" />
                {stat.suffix}
              </p>
              <p className="text-[12px] text-white/35 uppercase tracking-widest">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
