"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface FuturisticSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  width?: string;
  icon?: React.ReactNode;
}

/**
 * Futuristic Select Component
 * Replaces native <select> with a custom dropdown that matches zer0Gig's dark theme.
 * Features: smooth animations, search icon, consistent styling across the app.
 */
export default function FuturisticSelect({
  options,
  value,
  onChange,
  placeholder,
  className = "",
  width = "w-44",
  icon,
}: FuturisticSelectProps) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
    setFocused(false);
  };

  return (
    <div ref={containerRef} className={`relative ${width} ${className}`}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(!open); setFocused(true); }}
        className={`w-full flex items-center gap-2.5 bg-[#0d1525]/90 backdrop-blur-sm border rounded-xl px-4 py-2.5 text-[14px] transition-all cursor-pointer text-left ${
          open || focused
            ? "border-white/30 bg-[#0d1525]"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        {/* Optional leading icon */}
        {icon && (
          <span className="text-white/40 flex-shrink-0">{icon}</span>
        )}
        {/* Selected label */}
        <span className={`flex-1 truncate ${selectedOption ? "text-white" : "text-white/40"}`}>
          {selectedOption?.label || placeholder || "Select..."}
        </span>
        {/* Chevron */}
        <motion.svg
          className="w-4 h-4 text-white/30 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0d1525]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="py-1 max-h-64 overflow-y-auto">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white/90"
                    }`}
                  >
                    {/* Option icon */}
                    {option.icon && (
                      <span className="text-white/40 flex-shrink-0">{option.icon}</span>
                    )}
                    {/* Option label */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{option.label}</p>
                      {option.description && (
                        <p className="text-[11px] text-white/30 truncate">{option.description}</p>
                      )}
                    </div>
                    {/* Selected checkmark */}
                    {isSelected && (
                      <svg className="w-4 h-4 text-[#38bdf8] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
