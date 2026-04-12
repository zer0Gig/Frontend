"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import { animate } from "animejs";
import BorderGlow from "./BorderGlow/BorderGlow";

// ── Landing page nav links ─────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: "Home",         href: "/"              },
  { label: "Marketplace",  href: "/marketplace"   },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Docs",         href: "/docs"          },
];

// ── LandingNavbar ─────────────────────────────────────────────────────────────

export default function Navbar() {
  const pillRef           = useRef<HTMLDivElement>(null);
  const indicatorRef      = useRef<HTMLDivElement>(null);
  const linksContainerRef = useRef<HTMLDivElement>(null);
  const linkRefs          = useRef<(HTMLAnchorElement | null)[]>([]);
  const logoRef           = useRef<HTMLAnchorElement>(null);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingIn, setLoggingIn]   = useState(false);

  const pathname    = usePathname();
  const router      = useRouter();
  const { address } = useAccount();
  const { login, logout, authenticated } = usePrivy();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const activeIdx = NAV_LINKS.findIndex((link) => {
    if (!pathname) return false;
    if (link.href === "/") return pathname === "/";
    const base = link.href.split("#")[0];
    return base !== "/" && pathname.startsWith(base);
  });

  // ── Entrance ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!pillRef.current) return;
    animate(pillRef.current, {
      translateY: ["-32px", "0px"],
      opacity:    [0, 1],
      duration:   750,
      ease:       "outExpo",
      delay:      80,
    });
  }, []);

  // ── Sliding indicator ─────────────────────────────────────────────────────

  const moveIndicator = useCallback((idx: number) => {
    const link      = linkRefs.current[idx];
    const container = linksContainerRef.current;
    const indicator = indicatorRef.current;
    if (!link || !container || !indicator) return;

    const lRect = link.getBoundingClientRect();
    const cRect = container.getBoundingClientRect();

    animate(indicator, {
      left:     lRect.left - cRect.left - 8,
      width:    lRect.width + 16,
      opacity:  1,
      duration: 230,
      ease:     "outQuart",
    });
  }, []);

  const hideIndicator = useCallback(() => {
    if (!indicatorRef.current) return;
    animate(indicatorRef.current, { opacity: 0, duration: 160, ease: "outQuart" });
  }, []);

  useEffect(() => {
    if (hoveredIdx !== null) moveIndicator(hoveredIdx);
    else if (activeIdx >= 0) moveIndicator(activeIdx);
    else hideIndicator();
  }, [hoveredIdx, activeIdx, moveIndicator, hideIndicator]);

  useEffect(() => {
    if (activeIdx >= 0) {
      const t = setTimeout(() => moveIndicator(activeIdx), 250);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Logo pulse ────────────────────────────────────────────────────────────

  const handleLogoEnter = () => {
    if (!logoRef.current) return;
    animate(logoRef.current, { scale: [1, 1.08, 1], duration: 400, ease: "outElastic" });
  };

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (loggingIn && authenticated) {
      setLoggingIn(false);
      router.push("/dashboard");
    }
  }, [loggingIn, authenticated, router]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <nav
      className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      aria-label="Main navigation"
    >
      {/* ── Pill ──────────────────────────────────────────────────────────── */}
      <div
        ref={pillRef}
        className="pointer-events-auto flex items-center gap-1.5 px-4 py-3 rounded-full border border-white/[0.09] bg-[#0d1525]/90 backdrop-blur-2xl shadow-[0_10px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
        style={{ opacity: 0 }}
      >
        {/* Logo */}
        <Link
          ref={logoRef}
          href="/"
          onMouseEnter={handleLogoEnter}
          className="mr-3 px-1 py-0.5 flex items-center select-none"
        >
          <span className="text-white text-[17px] font-semibold tracking-tight">
            zer0<span className="text-[#38bdf8]">Gig</span>
          </span>
        </Link>

        <div className="w-px h-5 bg-white/[0.08] mr-3" />

        {/* Desktop links */}
        <div ref={linksContainerRef} className="hidden md:flex items-center relative">
          <div
            ref={indicatorRef}
            className="absolute top-1/2 -translate-y-1/2 h-[34px] rounded-full bg-white/[0.07] border border-white/[0.09] pointer-events-none"
            style={{ opacity: 0, left: 0, width: 70 }}
          />
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => { linkRefs.current[i] = el; }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`relative z-10 px-3.5 py-2 text-[14px] font-medium rounded-full whitespace-nowrap transition-colors duration-150 ${
                i === activeIdx ? "text-white" : "text-white/45 hover:text-white/80"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:block w-px h-5 bg-white/[0.08] mx-3" />

        {/* Wallet */}
        <div className="hidden md:block">
          {authenticated ? (
            <button
              onClick={() => { queryClient.clear(); disconnect(); logout(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.05] border border-white/[0.08] text-[13px] text-white hover:bg-white/10 transition-all whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              {shortAddress ?? "Connected"}
            </button>
          ) : (
            <BorderGlow
              edgeSensitivity={40}
              glowColor="200 80 80"
              backgroundColor="#000000"
              borderRadius={999}
              glowRadius={20}
              glowIntensity={0.8}
              coneSpread={30}
              colors={["#38bdf8", "#22d3ee", "#4ade80"]}
              fillOpacity={0.3}
            >
              <button
                onClick={() => { setLoggingIn(true); login(); }}
                className="px-5 py-2 text-white text-[14px] font-medium whitespace-nowrap"
              >
                Connect Wallet
              </button>
            </BorderGlow>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-1 p-1.5 text-white/60 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {mobileOpen
              ? <path d="M6 6L18 18M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              : <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            }
          </svg>
        </button>
      </div>

      {/* ── Mobile dropdown ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.25, 0.4, 0.25, 1] }}
            className="pointer-events-auto absolute top-[calc(100%+10px)] left-4 right-4 rounded-2xl border border-white/[0.08] bg-[#0d1525]/95 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] p-3 flex flex-col gap-1"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-[15px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-white/[0.06] my-1" />
            {authenticated ? (
              <button
                onClick={() => { queryClient.clear(); disconnect(); logout(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-[15px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {shortAddress} — Disconnect
              </button>
            ) : (
              <button
                onClick={() => { setLoggingIn(true); login(); setMobileOpen(false); }}
                className="px-4 py-3 rounded-xl text-[15px] font-semibold text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-all text-left"
              >
                Connect Wallet
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
