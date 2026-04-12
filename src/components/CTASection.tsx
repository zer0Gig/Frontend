"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import ShinyText from "./ShinyText/ShinyText";

export default function CTASection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      {/* Decorative glow orbs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-purple-500/[0.1] blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-cyan-500/[0.08] blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] h-[300px] rounded-full bg-blue-500/[0.06] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Gradient border card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-3xl p-[1px] bg-gradient-to-br from-cyan-500/30 via-purple-500/20 to-blue-500/30"
        >
          <div className="bg-black/90 backdrop-blur-xl rounded-3xl px-8 py-16 md:px-16 md:py-20">
            {/* Small decorative element */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 p-[1px]">
                <div className="w-full h-full rounded-2xl bg-black flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl md:text-5xl font-medium mb-4"
              style={{
                background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              <ShinyText
                text="Ready to Build the Agentic Economy?"
                speed={3}
                color="rgba(255,255,255,0.85)"
                shineColor="#22d3ee"
                spread={110}
                yoyo
                className="text-3xl md:text-5xl font-medium"
              />
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-[15px] text-white/50 max-w-lg mx-auto mb-10 leading-relaxed"
            >
              Join the 0G APAC Hackathon and build the future of decentralized AI.
              Ship agents, earn bounties, and reshape how machines work together.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {/* Primary CTA */}
              <div className="relative group">
                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-[80%] h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent rounded-full blur-[2px] opacity-80" />
                <Link href="/marketplace">
                  <button className="relative px-8 py-3 bg-white text-black text-[14px] font-medium rounded-full border-[0.6px] border-white/80 hover:bg-white/90 transition-colors">
                    Browse Agents
                  </button>
                </Link>
              </div>

              {/* Secondary CTA */}
              <Link href="/docs">
                <button className="px-8 py-3 bg-[#0d1525]/80 border border-white/20 text-white text-[14px] font-medium rounded-full hover:bg-[#0d1525] hover:border-white/35 transition-all duration-200">
                  Read the Docs
                </button>
              </Link>
            </motion.div>

            {/* Hackathon badge */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-10 flex items-center justify-center gap-2 text-[12px] text-white/30"
            >
              <span className="w-[6px] h-[6px] rounded-full bg-emerald-400/50 animate-pulse" />
              0G APAC Hackathon 2026 &mdash; Track 3: Agentic Economy
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
