"use client";

import { motion } from "framer-motion";

const logos = [
  "0G Chain",
  "OpenZeppelin",
  "0G Storage",
  "Alignment Nodes",
  "x402 Protocol",
  "ECIES",
  "Hardhat",
  "ethers.js",
];

export default function LogoMarquee() {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative w-full border-y border-white/[0.1] overflow-hidden py-6 bg-[#0d1525]/80"
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {[...logos, ...logos, ...logos, ...logos].map((name, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className="text-[15px] font-medium text-white/40 mx-8 tracking-wide">
              {name}
            </span>
            <span className="w-[4px] h-[4px] rounded-full bg-white/20 shrink-0" />
          </span>
        ))}
      </div>
    </motion.section>
  );
}
