"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import { animate } from "animejs";
import { Store, Zap, Book } from "lucide-react";

// ── App nav links ──────────────────────────────────────────────────────────────

const APP_LINKS = [
  { label: "Marketplace", href: "/marketplace",  icon: <Store size={16} /> },
  { label: "Dashboard",   href: "/dashboard",    icon: <Zap size={16} /> },
  { label: "Docs",        href: "/docs",         icon: <Book size={16} /> },
];

// ── Back button config per route ───────────────────────────────────────────────

function getBackConfig(pathname: string): { label: string; href: string } | null {
  if (pathname.startsWith("/dashboard/register-agent"))  return { label: "Dashboard", href: "/dashboard" };
  if (pathname.startsWith("/dashboard/create-job"))      return { label: "Dashboard", href: "/dashboard" };
  if (pathname.startsWith("/dashboard/create-subscription")) return { label: "Dashboard", href: "/dashboard" };
  if (pathname === "/dashboard/jobs")                return { label: "Dashboard", href: "/dashboard" };
  if (pathname === "/dashboard/my-proposals")        return { label: "Dashboard", href: "/dashboard" };
  if (pathname.startsWith("/dashboard/jobs/"))           return { label: "Jobs",      href: "/dashboard/jobs" };
  if (pathname.startsWith("/dashboard/agents/"))         return { label: "Agents",    href: "/dashboard?tab=agents" };
  if (pathname.startsWith("/dashboard/subscriptions/"))  return { label: "Subscriptions", href: "/dashboard?tab=subscriptions" };
  return null;
}

// ── Section label ──────────────────────────────────────────────────────────────

function getSectionLabel(pathname: string): string {
  if (pathname === "/marketplace")                          return "Marketplace";
  if (pathname === "/docs")                                 return "Docs";
  if (pathname === "/dashboard")                            return "Dashboard";
  if (pathname.startsWith("/dashboard/register-agent"))    return "Register Agent";
  if (pathname.startsWith("/dashboard/create-job"))        return "Post a Job";
  if (pathname.startsWith("/dashboard/create-subscription")) return "New Subscription";
  if (pathname === "/dashboard/jobs")              return "Open Jobs";
  if (pathname === "/dashboard/my-proposals")      return "My Proposals";
  if (pathname.startsWith("/dashboard/jobs/"))             return "Job Details";
  if (pathname.startsWith("/dashboard/agents/"))           return "Agent Details";
  if (pathname.startsWith("/dashboard/subscriptions/"))    return "Subscription Details";
  return "";
}

// ── AppNavbar ──────────────────────────────────────────────────────────────────

export default function AppNavbar() {
  const barRef            = useRef<HTMLDivElement>(null);
  const indicatorRef      = useRef<HTMLDivElement>(null);
  const linksContainerRef = useRef<HTMLDivElement>(null);
  const linkRefs          = useRef<(HTMLAnchorElement | null)[]>([]);
  const logoRef           = useRef<HTMLAnchorElement>(null);

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingIn, setLoggingIn]   = useState(false);

  const pathname    = usePathname() ?? "";
  const router      = useRouter();
  const { address } = useAccount();
  const { login, logout, authenticated } = usePrivy();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : null;

  const activeIdx = APP_LINKS.findIndex((link) => {
    if (link.href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    return pathname.startsWith(link.href);
  });

  const backConfig   = getBackConfig(pathname);
  const sectionLabel = getSectionLabel(pathname);

  // ── Entrance ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!barRef.current) return;
    animate(barRef.current, {
      translateY: ["-28px", "0px"],
      opacity:    [0, 1],
      duration:   650,
      ease:       "outExpo",
      delay:      60,
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
      left:     lRect.left - cRect.left - 6,
      width:    lRect.width + 12,
      opacity:  1,
      duration: 220,
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
    animate(logoRef.current, { scale: [1, 1.07, 1], duration: 380, ease: "outElastic" });
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
      className="fixed top-5 left-0 right-0 z-50 flex justify-center px-5 pointer-events-none"
      aria-label="App navigation"
    >
      {/* ── Wide floating bar ─────────────────────────────────────────────── */}
      <div
        ref={barRef}
        className="pointer-events-auto w-full max-w-6xl flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/[0.08] bg-[#0a0f1e]/92 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
        style={{ opacity: 0 }}
      >

        {/* ── Left: Logo + back/section ──────────────────────────────────── */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <Link
            ref={logoRef}
            href="/"
            onMouseEnter={handleLogoEnter}
            className="flex items-center select-none shrink-0"
          >
            <span className="text-white text-[16px] font-semibold tracking-tight">
              zer0<span className="text-[#38bdf8]">Gig</span>
            </span>
          </Link>

          {/* Breadcrumb separator + section */}
          <AnimatePresence mode="wait">
            {sectionLabel && (
              <motion.div
                key={sectionLabel}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5"
              >
                <span className="text-white/20 text-[13px]">/</span>
                <span className="text-white/50 text-[13px] font-medium truncate max-w-[140px]">
                  {sectionLabel}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Center: Nav links ──────────────────────────────────────────── */}
        <div ref={linksContainerRef} className="hidden md:flex items-center relative">
          <div
            ref={indicatorRef}
            className="absolute top-1/2 -translate-y-1/2 h-[32px] rounded-xl bg-white/[0.07] border border-white/[0.08] pointer-events-none"
            style={{ opacity: 0, left: 0, width: 70 }}
          />
          {APP_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              ref={(el) => { linkRefs.current[i] = el; }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`relative z-10 px-3.5 py-1.5 text-[13px] font-medium rounded-xl whitespace-nowrap transition-colors duration-150 flex items-center gap-1.5 ${
                i === activeIdx ? "text-white" : "text-white/40 hover:text-white/75"
              }`}
            >
              <span className="text-[11px]">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Right: Back button + wallet ────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-2 shrink-0">

          {/* Back button (sub-pages only) */}
          <AnimatePresence>
            {backConfig && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <Link
                  href={backConfig.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] text-white/45 hover:text-white/80 hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/[0.08]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {backConfig.label}
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wallet */}
          {authenticated ? (
            <button
              onClick={() => { queryClient.clear(); disconnect(); logout(); }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.07] text-[12px] text-white hover:bg-white/10 transition-all whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
              {shortAddress ?? "Connected"}
            </button>
          ) : (
            <button
              onClick={() => { setLoggingIn(true); login(); }}
              className="px-3.5 py-1.5 rounded-xl bg-[#38bdf8] text-black text-[12px] font-semibold hover:bg-[#7dd3fc] active:scale-95 transition-all whitespace-nowrap"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden ml-auto p-1.5 text-white/60 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
            className="pointer-events-auto absolute top-[calc(100%+8px)] left-5 right-5 rounded-2xl border border-white/[0.08] bg-[#0a0f1e]/95 backdrop-blur-2xl shadow-[0_16px_48px_rgba(0,0,0,0.5)] p-3 flex flex-col gap-1"
          >
            {/* Back link on mobile */}
            {backConfig && (
              <>
                <Link
                  href={backConfig.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back to {backConfig.label}
                </Link>
                <div className="h-px bg-white/[0.06] my-1" />
              </>
            )}

            {APP_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[15px] font-medium text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-white/[0.06] my-1" />

            {authenticated ? (
              <button
                onClick={() => { queryClient.clear(); disconnect(); logout(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-[14px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
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
