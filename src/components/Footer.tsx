"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const links = [
  { label: "Docs", href: "/docs", external: false },
  { label: "GitHub", href: "https://github.com", external: true },
  { label: "0G Chain", href: "https://0g.ai", external: true },
];

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative border-t border-white/[0.1] bg-[#0d1525]/90"
    >
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <span className="text-white text-[15px] font-semibold tracking-tight">
            zer0<span className="text-[#38bdf8] font-semibold ml-0.5">Gig</span>
          </span>
        </div>

        {/* Center: Links */}
        <div className="flex items-center gap-6">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        {/* Right: Hackathon label */}
        <div className="text-[12px] text-white/25">
          Built for 0G APAC Hackathon 2026
        </div>
      </div>
    </motion.footer>
  );
}
