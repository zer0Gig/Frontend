"use client";

import { useState } from "react";
import type { PlatformSkill } from "@/components/PreBuiltToolsGrid";

interface SkillConfigModalProps {
  skill: PlatformSkill;
  existingConfig: Record<string, string>;
  onSave: (skillId: string, config: Record<string, string>) => void;
  onClose: () => void;
}

/** Extract properties from a JSON Schema config_schema */
function getSchemaProps(schema: Record<string, unknown>) {
  const props = (schema?.properties as Record<string, { type?: string; title?: string; description?: string; default?: unknown }>) || {};
  return Object.entries(props).map(([key, def]) => ({
    key,
    title:       def.title       || key,
    description: def.description || "",
    type:        def.type        || "string",
    defaultVal:  def.default !== undefined ? String(def.default) : "",
  }));
}

export default function SkillConfigModal({ skill, existingConfig, onSave, onClose }: SkillConfigModalProps) {
  const fields = getSchemaProps(skill.config_schema);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach(f => {
      init[f.key] = existingConfig[f.key] ?? f.defaultVal;
    });
    return init;
  });

  if (fields.length === 0) {
    // No config needed — save immediately and close
    onSave(skill.id, {});
    onClose();
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1525] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{skill.icon}</span>
            <div>
              <h3 className="text-white font-medium text-[15px]">{skill.name}</h3>
              <p className="text-white/40 text-[11px] mt-0.5">Configure skill settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {fields.map(field => (
            <div key={field.key}>
              <label className="block text-[12px] text-white/50 mb-1.5">
                {field.title}
              </label>
              {field.type === "number" ? (
                <input
                  type="number"
                  value={values[field.key]}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-white/25"
                />
              ) : field.key.toLowerCase().includes("key") || field.key.toLowerCase().includes("token") || field.key.toLowerCase().includes("secret") ? (
                <input
                  type="password"
                  value={values[field.key]}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  placeholder="sk-..."
                  className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.key]}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] focus:outline-none focus:border-white/25"
                />
              )}
              {field.description && (
                <p className="text-[10px] text-white/25 mt-1">{field.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 text-[13px] hover:border-white/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(skill.id, values); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-[#38bdf8]/15 border border-[#38bdf8]/30 text-[#38bdf8] text-[13px] font-medium hover:bg-[#38bdf8]/20 transition-colors"
          >
            Save & Enable
          </button>
        </div>
      </div>
    </div>
  );
}
