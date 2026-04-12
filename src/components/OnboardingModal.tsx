"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Zap } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSignMessage } from "wagmi";

export type UserRole = "client" | "agent_owner" | null;

export interface UserProfile {
  displayName: string;
  email: string;
  role: UserRole;
  onboarded: boolean;
  walletAddress?: string;
  savedAt?: number;
  version?: string;
  cid?: string;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: "",
  email: "",
  role: null,
  onboarded: false,
};

const CID_STORAGE_KEY = (address: string) => `deai_profile_cid_${address.toLowerCase()}`;

export function getProfileCID(address: string): string | null {
  try {
    return localStorage.getItem(CID_STORAGE_KEY(address));
  } catch {
    return null;
  }
}

export function saveProfileCID(address: string, cid: string) {
  try {
    localStorage.setItem(CID_STORAGE_KEY(address), cid);
  } catch {}
}

export function clearProfileCID(address: string) {
  try {
    localStorage.removeItem(CID_STORAGE_KEY(address));
  } catch {}
}

/**
 * Fetch profile from 0G Storage via API route
 */
export async function fetchProfile(cid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/profile?cid=${encodeURIComponent(cid)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.profile;
  } catch {
    return null;
  }
}

/**
 * Upload profile to 0G Storage via API route
 */
export async function uploadProfile(
  profile: Omit<UserProfile, "onboarded" | "walletAddress" | "savedAt" | "version" | "cid">,
  address: string,
  signature: `0x${string}`
): Promise<{ cid: string; profile: UserProfile } | null> {
  try {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        profile: { ...profile, onboarded: true },
        address,
        signature,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[Onboarding] Upload failed:", err);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error("[Onboarding] Upload error:", err);
    return null;
  }
}

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: (profile: UserProfile, cid: string) => void;
  onError: (error: string) => void;
}

export default function OnboardingModal({ isOpen, onComplete, onError }: OnboardingModalProps) {
  const { login } = usePrivy();
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [step, setStep] = useState<"login" | "register">("register");
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!profile.displayName.trim()) newErrors.displayName = "Name is required";
    if (!profile.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) newErrors.email = "Invalid email format";
    if (!profile.role) newErrors.role = "Please select a role";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!address) {
      onError("Wallet not connected. Please connect your wallet first.");
      return;
    }

    setUploading(true);

    try {
      // Create message for signature
      const profileData = { ...profile, onboarded: true };
      const message = `zer0Gig Profile:${JSON.stringify(profileData)}`;

      // Sign message with wallet
      const signature = await signMessageAsync({ message });

      // Upload to 0G Storage via API route
      const result = await uploadProfile(profileData, address, signature);

      if (!result) {
        onError("Failed to save profile to 0G Storage. Please try again.");
        setUploading(false);
        return;
      }

      // Save CID locally for quick access
      saveProfileCID(address, result.cid);

      // Complete onboarding
      onComplete({ ...result.profile, cid: result.cid }, result.cid);
    } catch (err: any) {
      console.error("[Onboarding] Submit error:", err);
      onError(err.message || "Failed to complete onboarding.");
    } finally {
      setUploading(false);
    }
  };

  const handleExistingUser = () => {
    setStep("login");
  };

  const handleNewUser = () => {
    setStep("register");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
            className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0d1525]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          >
            {/* Header gradient bar */}
            <div className="h-1 bg-gradient-to-r from-[#38bdf8] via-[#a855f7] to-[#22d3ee]" />

            <div className="p-8">
              {/* Logo + Title */}
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#38bdf8]/20 to-[#a855f7]/20 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-medium text-white mb-1">
                  {step === "login" ? "Welcome Back" : "Join zer0Gig"}
                </h2>
                <p className="text-white/40 text-[14px]">
                  {step === "login"
                    ? "Sign in to continue to your dashboard"
                    : "Set up your profile to start hiring or earning with AI agents"}
                </p>
                {/* 0G Storage badge */}
                <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Profile stored on 0G Storage
                </div>
              </div>

              {/* Step toggle (login vs register) */}
              <div className="flex gap-1 p-1 bg-[#050810]/60 rounded-xl mb-6">
                <button
                  onClick={handleNewUser}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                    step === "register"
                      ? "bg-white/10 text-white border border-white/10"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  New Account
                </button>
                <button
                  onClick={handleExistingUser}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                    step === "login"
                      ? "bg-white/10 text-white border border-white/10"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  Already Have Account
                </button>
              </div>

              {step === "login" ? (
                /* ── Login View ─────────────────────────────────────── */
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/5 border border-white/10 p-5 text-center">
                    <p className="text-white/60 text-[14px] mb-3">
                      Sign in with your existing wallet to access your dashboard.
                      Your profile is stored on 0G Storage.
                    </p>
                    <button
                      onClick={login}
                      className="w-full px-6 py-3 bg-white text-black text-[14px] font-medium rounded-full hover:bg-white/90 transition-colors"
                    >
                      Connect Wallet
                    </button>
                  </div>
                  <button
                    onClick={handleNewUser}
                    className="w-full text-center text-[#38bdf8] text-[13px] hover:underline"
                  >
                    Don't have an account? Sign up →
                  </button>
                </div>
              ) : (
                /* ── Register View ──────────────────────────────────── */
                <div className="space-y-5">
                  {/* Display Name */}
                  <div>
                    <label className="block text-[13px] text-white/50 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => { setProfile({ ...profile, displayName: e.target.value }); setErrors({ ...errors, displayName: "" }); }}
                      placeholder="e.g. Alex Chen"
                      className={`w-full bg-[#050810]/80 border rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors ${
                        errors.displayName ? "border-red-500/40" : "border-white/10"
                      }`}
                    />
                    {errors.displayName && <p className="text-red-400 text-[12px] mt-1">{errors.displayName}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[13px] text-white/50 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => { setProfile({ ...profile, email: e.target.value }); setErrors({ ...errors, email: "" }); }}
                      placeholder="alex@example.com"
                      className={`w-full bg-[#050810]/80 border rounded-xl px-4 py-3 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors ${
                        errors.email ? "border-red-500/40" : "border-white/10"
                      }`}
                    />
                    {errors.email && <p className="text-red-400 text-[12px] mt-1">{errors.email}</p>}
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label className="block text-[13px] text-white/50 mb-2">I want to...</label>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Client role */}
                      <button
                        onClick={() => { setProfile({ ...profile, role: "client" }); setErrors({ ...errors, role: "" }); }}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          profile.role === "client"
                            ? "border-[#38bdf8]/40 bg-[#38bdf8]/10"
                            : "border-white/10 bg-[#050810]/60 hover:border-white/20"
                        }`}
                      >
                        <div className="text-2xl mb-2"><Bot size={24} /></div>
                        <h4 className={`text-[14px] font-medium mb-0.5 ${profile.role === "client" ? "text-[#38bdf8]" : "text-white"}`}>
                          Hire AI Agents
                        </h4>
                        <p className="text-[12px] text-white/40">
                          Post tasks, review outputs, and pay automatically via smart contract escrow
                        </p>
                      </button>

                      {/* Agent Owner role */}
                      <button
                        onClick={() => { setProfile({ ...profile, role: "agent_owner" }); setErrors({ ...errors, role: "" }); }}
                        className={`rounded-xl border p-4 text-left transition-all ${
                          profile.role === "agent_owner"
                            ? "border-[#a855f7]/40 bg-[#a855f7]/10"
                            : "border-white/10 bg-[#050810]/60 hover:border-white/20"
                        }`}
                      >
                        <div className="text-2xl mb-2"><Zap size={24} /></div>
                        <h4 className={`text-[14px] font-medium mb-0.5 ${profile.role === "agent_owner" ? "text-[#a855f7]" : "text-white"}`}>
                          Own AI Agents
                        </h4>
                        <p className="text-[12px] text-white/40">
                          Register AI agents, set rates, and earn autonomously on-chain
                        </p>
                      </button>
                    </div>
                    {errors.role && <p className="text-red-400 text-[12px] mt-1">{errors.role}</p>}
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={uploading}
                    className="w-full px-6 py-3 bg-white text-black text-[14px] font-medium rounded-full hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Saving to 0G Storage...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </button>

                  {/* Login link */}
                  <button
                    onClick={handleExistingUser}
                    className="w-full text-center text-white/40 text-[13px] hover:text-white/60 transition-colors"
                  >
                    Already have an account? Sign in →
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
