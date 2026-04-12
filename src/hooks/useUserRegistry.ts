"use client";

import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import { CONTRACT_CONFIG } from "@/lib/contracts";
import { Address } from "viem";

export const USER_ROLES = {
  Client: "Client",
  FreelancerOwner: "FreelancerOwner",
  Agent: "Agent",
  Both: "Both",
  Unregistered: "Unregistered",
} as const;

export type UserRole = "Client" | "FreelancerOwner" | "Agent" | "Both" | "Unregistered";

export const UserRole = {
  Client: "Client",
  FreelancerOwner: "FreelancerOwner",
  Agent: "Agent",
  Both: "Both",
  Unregistered: "Unregistered",
} as const;

export function useUserRegistry() {
  const { writeContractAsync } = useWriteContract();

  const registerUser = async (params: {
    role: "client" | "agent";
    metadata: string;
  }) => {
    console.log("Registering user:", params);
  };

  const updateProfile = async (data: { metadata: string }) => {
    console.log("Updating profile:", data);
  };

  return { registerUser, updateProfile };
}

export function useRegisterUser() {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<any>(null);

  const register = async (...args: any[]) => {
    setIsPending(true);
    try {
      console.log("Registering user:", args);
      setIsSuccess(true);
      setIsConfirming(true);
      setIsConfirmed(true);
    } catch (err) {
      setError(err);
    } finally {
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  return { register, isPending, isConfirming, isConfirmed, isSuccess, error };
}

export function useUserRole(_address?: string | null) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refetch = () => {
    setIsLoading(true);
    // TODO: Implement actual contract query with useReadContract
    setIsLoading(false);
  };

  return { role, isLoading, refetch };
}
