"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import AppNavbar from "@/components/AppNavbar";
import Footer from "@/components/Footer";
import RoleSelectModal from "@/components/RoleSelectModal";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useDisconnect } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRole, UserRole } from "@/hooks/useUserRegistry";

type RoleWithTabs = "Client" | "FreelancerOwner";

const tabsByRole: Record<RoleWithTabs, { label: string; href: string }[]> = {
  Client: [
    { label: "Overview",      href: "/dashboard" },
    { label: "My Jobs",       href: "/dashboard?tab=jobs" },
    { label: "Subscriptions", href: "/dashboard?tab=subscriptions" },
  ],
  FreelancerOwner: [
    { label: "Overview",      href: "/dashboard" },
    { label: "Find Jobs",     href: "/dashboard/jobs" },
    { label: "My Proposals",  href: "/dashboard/my-proposals" },
    { label: "My Agents",     href: "/dashboard?tab=agents" },
    { label: "Subscriptions", href: "/dashboard?tab=subscriptions" },
  ],
};

// ── Isolated component so useSearchParams() is inside its own Suspense ────────
function DashboardTabs({ tabs }: { tabs: { label: string; href: string }[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams?.get("tab") ?? "overview";

  if (pathname !== "/dashboard") return null;

  return (
    <div className="flex gap-1 mb-8 p-1 bg-[#0d1525]/60 rounded-xl border border-white/10 w-fit">
      {tabs.map((tab) => {
        const isActive =
          (tab.label === "Overview" && activeTab === "overview") ||
          (tab.href.includes(`tab=${activeTab}`));
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${
              isActive
                ? "bg-white/10 text-white border border-white/10"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

// ── Main layout ───────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, ready, logout } = usePrivy();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [resolvedRole, setResolvedRole] = useState<UserRole | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const { role: onChainRole, isLoading: isRoleLoading, refetch: refetchRole } = useUserRole(address);

  // Track the address that resolved the current role — reset state when wallet switches
  const resolvedForAddress = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (address !== resolvedForAddress.current) {
      setResolvedRole(null);
      setShowRoleModal(false);
      resolvedForAddress.current = address;
    }
  }, [address]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Detect on-chain role and route user to their workspace.
  // Guard: skip if resolvedRole is already set — prevents stale wagmi cache
  // from re-opening the modal after the user just registered this session.
  useEffect(() => {
    if (!authenticated || !address || isRoleLoading || onChainRole === null) return;
    if (resolvedRole !== null) return; // already resolved this session — don't override

    if (onChainRole === UserRole.Unregistered) {
      setShowRoleModal(true);
    } else {
      setResolvedRole(onChainRole);
      setShowRoleModal(false);
      // Auto-redirect to the correct workspace tab
      if (onChainRole === UserRole.FreelancerOwner && window.location.pathname === "/dashboard" && !window.location.search) {
        router.replace("/dashboard?tab=agents");
      }
    }
  }, [authenticated, address, isRoleLoading, onChainRole, resolvedRole, router]);

  const handleRoleConfirmed = (role: UserRole) => {
    setResolvedRole(role);
    setShowRoleModal(false);
    // Refetch so wagmi cache reflects the new on-chain state
    refetchRole();
    // Redirect to workspace
    if (role === UserRole.FreelancerOwner) {
      router.push("/dashboard?tab=agents");
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogout = async () => {
    // Clear all cached query data so the next login starts fresh
    queryClient.clear();
    // Disconnect wagmi connector (clears its localStorage state)
    disconnect();
    await logout();
    router.push("/");
  };

  // ── Loading / auth guards ─────────────────────────────────────────────────

  if (!ready || (authenticated && isRoleLoading && resolvedRole === null)) {
    return (
      <main className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-[#38bdf8] animate-spin" />
          <p className="text-white/30 text-[13px]">
            {!ready ? "Connecting..." : "Checking your account..."}
          </p>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="animate-pulse text-white/40 text-[14px]">Redirecting...</div>
      </main>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────

  const tabs = resolvedRole
    ? tabsByRole[resolvedRole as RoleWithTabs]
    : tabsByRole.Client;

  const roleBadge =
    resolvedRole === UserRole.Client
      ? { label: "Client", color: "bg-[#38bdf8]/10 text-[#38bdf8]" }
      : resolvedRole === UserRole.FreelancerOwner
      ? { label: "Agent Owner", color: "bg-[#a855f7]/10 text-[#a855f7]" }
      : null;

  return (
    <>
      <RoleSelectModal isOpen={showRoleModal} onConfirmed={handleRoleConfirmed} />

      <main className="min-h-screen bg-[#050810]">
        <AppNavbar />
        <div className="pt-28 pb-16 px-6 max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1
                className="text-3xl md:text-4xl font-medium mb-1"
                style={{
                  background: "linear-gradient(144.5deg, #ffffff 28%, rgba(255,255,255,0.3) 95%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Dashboard
              </h1>
              {address && (
                <div className="flex items-center gap-2">
                  <p className="text-white/40 text-[13px] font-mono">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </p>
                  {roleBadge && (
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge.color}`}>
                      {roleBadge.label}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 items-center">
              {resolvedRole === UserRole.Client && (
                <Link
                  href="/dashboard/create-job"
                  className="px-4 py-2 bg-white text-black text-[13px] font-medium rounded-full hover:bg-white/90 transition-colors"
                >
                  + New Job
                </Link>
              )}
              <Link
                href="/dashboard/create-subscription"
                className="px-4 py-2 bg-[#0d1525]/90 border border-white/20 text-white text-[13px] font-medium rounded-full hover:border-white/40 transition-colors"
              >
                + Subscribe
              </Link>
              {resolvedRole === UserRole.FreelancerOwner && (
                <Link
                  href="/dashboard/register-agent"
                  className="px-4 py-2 bg-[#0d1525]/90 border border-white/20 text-white text-[13px] font-medium rounded-full hover:border-white/40 transition-colors"
                >
                  + Register Agent
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-white/40 text-[13px] hover:text-white/70 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Tab bar — wrapped in Suspense because DashboardTabs uses useSearchParams */}
          <Suspense fallback={null}>
            <DashboardTabs tabs={tabs} />
          </Suspense>

          {children}
        </div>
        <Footer />
      </main>
    </>
  );
}
