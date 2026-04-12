"use client";

import { useState } from "react";

export interface Milestone {
  id: string;
  description: string;
  percentage: number;
  amount: string;
  status: "pending" | "submitted" | "approved" | "rejected";
}

interface MilestoneBuilderProps {
  milestones?: Milestone[];
  onChange?: (milestones: Milestone[]) => void;
  totalBudget?: string;
  onSubmit?: (percentages: number[], criteria: string[]) => void;
  isPending?: boolean;
}

export default function MilestoneBuilder({
  milestones: externalMilestones,
  onChange,
  totalBudget,
  onSubmit,
  isPending,
}: MilestoneBuilderProps) {
  const [internalMilestones, setInternalMilestones] = useState<Milestone[]>([]);
  const milestones = externalMilestones ?? internalMilestones;
  const handleOnChange = onChange ?? setInternalMilestones;

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: `milestone-${Date.now()}`,
      description: "",
      percentage: 0,
      amount: "0",
      status: "pending",
    };
    handleOnChange([...milestones, newMilestone]);
  };

  const updateMilestone = (index: number, updates: Partial<Milestone>) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], ...updates };
    handleOnChange(updated);
  };

  const removeMilestone = (index: number) => {
    handleOnChange(milestones.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!onSubmit) return;
    const percentages = milestones.map(m => m.percentage);
    const criteria = milestones.map(m => m.description);
    onSubmit(percentages, criteria);
  };

  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <div key={milestone.id} className="p-4 bg-white/5 rounded-lg">
          <input
            type="text"
            placeholder="Milestone description"
            value={milestone.description}
            onChange={(e) => updateMilestone(index, { description: e.target.value })}
            className="w-full p-2 bg-white/10 rounded mb-2"
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="%"
              value={milestone.percentage}
              onChange={(e) => updateMilestone(index, { percentage: Number(e.target.value) })}
              className="w-20 p-2 bg-white/10 rounded"
            />
            <input
              type="text"
              placeholder="Amount"
              value={milestone.amount}
              onChange={(e) => updateMilestone(index, { amount: e.target.value })}
              className="flex-1 p-2 bg-white/10 rounded"
            />
            <button
              onClick={() => removeMilestone(index)}
              className="px-3 py-2 bg-red-500/20 text-red-400 rounded"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addMilestone}
        className="w-full p-3 border border-white/20 rounded-lg hover:bg-white/5"
      >
        + Add Milestone
      </button>
      {onSubmit && (
        <button
          onClick={handleSubmit}
          disabled={isPending || milestones.length === 0}
          className="w-full px-6 py-3 bg-white text-black text-[14px] font-medium rounded-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Confirm in wallet..." : "Define Milestones"}
        </button>
      )}
    </div>
  );
}
