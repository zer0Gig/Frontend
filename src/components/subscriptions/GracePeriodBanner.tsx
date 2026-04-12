"use client";

import { useState, useEffect } from "react";
import { parseEther } from "viem";
import { formatCountdown } from "@/lib/utils";

interface GracePeriodBannerProps {
  subscriptionId: bigint;
  gracePeriodEnds: bigint;
  onTopUp: (amount: bigint) => void;
  onFinalize: () => void;
  isTopUpPending: boolean;
  isFinalizePending: boolean;
}

export default function GracePeriodBanner({
  subscriptionId,
  gracePeriodEnds,
  onTopUp,
  onFinalize,
  isTopUpPending,
  isFinalizePending,
}: GracePeriodBannerProps) {
  const [topUpAmount, setTopUpAmount] = useState("");
  // FIX: Live countdown using setInterval — was previously calculated once and never updated
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Number(gracePeriodEnds) - now;
  const isExpired = remaining <= 0;

  const handleTopUp = () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) return;
    onTopUp(parseEther(topUpAmount));
    setTopUpAmount("");
  };

  // Expired grace period UI
  if (isExpired) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-red-400 font-medium text-[14px]">Grace Period Expired</p>
        </div>
        <p className="text-red-400/70 text-[13px] mb-4">
          This subscription has expired. Any remaining balance can be finalized (returned to client).
        </p>
        <button
          onClick={onFinalize}
          disabled={isFinalizePending}
          className="w-full px-4 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 text-[13px] font-medium rounded-full hover:bg-red-500/30 transition-colors disabled:opacity-50"
        >
          {isFinalizePending ? "Finalizing..." : "Finalize Expired Subscription"}
        </button>
      </div>
    );
  }

  // Active grace period UI
  return (
    <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-yellow-400"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-yellow-400 font-medium text-[14px]">Subscription Paused</p>
          </div>
          <p className="text-yellow-400/70 text-[13px] mb-3">
            Insufficient balance. Add funds within {formatCountdown(remaining)} or the subscription will expire.
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-[12px] text-yellow-400/50">Grace ends</p>
          <p className="text-yellow-400 text-[14px] font-mono">{formatCountdown(remaining)}</p>
        </div>
      </div>

      {/* Top-up inline */}
      <div className="flex gap-2 mt-2">
        <input
          type="number"
          value={topUpAmount}
          onChange={(e) => setTopUpAmount(e.target.value)}
          placeholder="Amount in OG"
          className="flex-1 bg-yellow-900/20 border border-yellow-500/30 rounded-xl px-4 py-2.5 text-white text-[14px] placeholder:text-yellow-400/40 focus:outline-none focus:border-yellow-500/50"
        />
        <button
          onClick={handleTopUp}
          disabled={isTopUpPending || !topUpAmount}
          className="px-5 py-2.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-[13px] font-medium rounded-full hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
        >
          {isTopUpPending ? "Adding..." : "Add Funds"}
        </button>
      </div>
    </div>
  );
}
