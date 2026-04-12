"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

interface RBACGuardProps {
  children: React.ReactNode;
  fallbackRedirect?: string;
}

export default function RBACGuard({ children, fallbackRedirect = "/" }: RBACGuardProps) {
  const router = useRouter();
  const { authenticated, ready } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push(fallbackRedirect);
    }
  }, [ready, authenticated, router, fallbackRedirect]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-white/40 text-[14px] animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
