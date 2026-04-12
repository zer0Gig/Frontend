import { SKILL_LABELS } from "@/hooks/useAgentManagement";
import { useState } from "react";
import FuturisticSelect, { SelectOption } from "@/components/ui/FuturisticSelect";

// Derive SKILL_OPTIONS from the single source of truth (SKILL_LABELS)
const SKILL_OPTIONS = Object.values(SKILL_LABELS);

const SORT_OPTIONS: SelectOption[] = [
  { value: "score", label: "Top Rated" },
  { value: "rate_asc", label: "Rate: Low → High" },
  { value: "rate_desc", label: "Rate: High → Low" },
  { value: "jobs", label: "Most Jobs" },
  { value: "newest", label: "Newest" },
];

interface AgentFiltersProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedSkill: string | null;
  onSkillChange: (s: string | null) => void;
  sortBy: "score" | "rate_asc" | "rate_desc" | "jobs" | "newest";
  onSortChange: (s: "score" | "rate_asc" | "rate_desc" | "jobs" | "newest") => void;
  totalShowing: number;
  totalCount: number;
  // Advanced filters
  minScore?: number;
  onMinScoreChange?: (score: number | null) => void;
  maxRate?: string;
  onMaxRateChange?: (rate: string | null) => void;
  activeOnly?: boolean;
  onActiveOnlyChange?: (active: boolean) => void;
}

export default function AgentFilters({
  searchQuery,
  onSearchChange,
  selectedSkill,
  onSkillChange,
  sortBy,
  onSortChange,
  totalShowing,
  totalCount,
  minScore,
  onMinScoreChange,
  maxRate,
  onMaxRateChange,
  activeOnly,
  onActiveOnlyChange,
}: AgentFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = minScore != null || !!maxRate || activeOnly;

  const clearAll = () => {
    onSearchChange("");
    onSkillChange(null);
    onMinScoreChange?.(null);
    onMaxRateChange?.(null);
    onActiveOnlyChange?.(false);
  };

  return (
    <div className="space-y-4 mb-8">
      {/* Primary filters row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Search input */}
        <div className="relative flex-grow min-w-[200px]">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by agent ID or address..."
            className="w-full bg-[#0d1525]/90 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-white text-[14px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
          />
        </div>

        {/* Skill filter */}
        <FuturisticSelect
          options={[
            { value: "", label: "All Skills" },
            ...SKILL_OPTIONS.map(skill => ({ value: skill, label: skill })),
          ]}
          value={selectedSkill || ""}
          onChange={(v) => onSkillChange(v || null)}
          placeholder="All Skills"
          width="w-44"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
        />

        {/* Sort dropdown */}
        <FuturisticSelect
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(v) => onSortChange(v as "score" | "rate_asc" | "rate_desc" | "jobs" | "newest")}
          placeholder="Sort by"
          width="w-44"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
            </svg>
          }
        />

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`px-3 py-2.5 rounded-xl border text-[13px] font-medium transition-all flex items-center gap-1.5 ${
            showAdvanced || hasActiveFilters
              ? "border-[#38bdf8]/40 bg-[#38bdf8]/10 text-[#38bdf8]"
              : "border-white/10 text-white/40 hover:border-white/20"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
          {hasActiveFilters && (
            <span className="w-4 h-4 rounded-full bg-[#38bdf8] text-[#050810] text-[10px] font-bold flex items-center justify-center">
              {[minScore != null, !!maxRate, activeOnly].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Results count */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[13px] text-white/40">
            Showing {totalShowing} of {totalCount} agents
          </span>
          {(searchQuery || selectedSkill || hasActiveFilters) && (
            <button
              onClick={clearAll}
              className="text-[12px] text-[#38bdf8] hover:text-[#38bdf8]/80 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters panel */}
      {showAdvanced && (
        <div className="rounded-xl border border-white/10 bg-[#0d1525]/60 p-4 flex flex-wrap gap-6">
          {/* Min score filter */}
          {onMinScoreChange && (
            <div>
              <label className="block text-[11px] text-white/40 uppercase tracking-wide mb-1.5">
                Min Reputation Score
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={minScore || ""}
                  onChange={(e) => onMinScoreChange(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Any"
                  className="w-24 bg-[#050810]/80 border border-white/10 rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
                />
                <span className="text-white/40 text-[12px]">/ 100</span>
              </div>
            </div>
          )}

          {/* Max rate filter */}
          {onMaxRateChange && (
            <div>
              <label className="block text-[11px] text-white/40 uppercase tracking-wide mb-1.5">
                Max Rate (OG/task)
              </label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={maxRate || ""}
                onChange={(e) => onMaxRateChange(e.target.value || null)}
                placeholder="Any"
                className="w-28 bg-[#050810]/80 border border-white/10 rounded-lg px-3 py-2 text-white text-[13px] placeholder:text-white/30 focus:outline-none focus:border-white/30"
              />
            </div>
          )}

          {/* Active only toggle */}
          {onActiveOnlyChange && (
            <div>
              <label className="block text-[11px] text-white/40 uppercase tracking-wide mb-1.5">
                Status
              </label>
              <button
                onClick={() => onActiveOnlyChange(!activeOnly)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                  activeOnly
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 text-white/40 hover:border-white/20"
                }`}
              >
                {activeOnly ? "Active Only" : "All Agents"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}