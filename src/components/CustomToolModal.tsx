"use client";

import { useState } from "react";
import { Globe, Plug } from "lucide-react";

export type ToolType = "http" | "mcp";

export interface ToolConfig {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  endpoint: string;
  apiKey: string;
}

interface CustomToolModalProps {
  mode: "add" | "edit";
  initialTool?: ToolConfig;
  onSave: (tool: ToolConfig) => void;
  onClose: () => void;
}

// ─── MCP CATALOG ────────────────────────────────────────────────────────────

const MCP_CATALOG = [
  {
    id: "composio",
    name: "Composio",
    description: "250+ app integrations — GitHub, Slack, Notion, Gmail, and more",
    endpoint: "https://mcp.composio.dev/composio/mcp",
    endpointPlaceholder: "https://mcp.composio.dev/composio/mcp?api_key=YOUR_KEY",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#a855f7",
    badge: "250+ apps",
    needsKey: true,
  },
  {
    id: "alpaca",
    name: "Alpaca Markets",
    description: "Stocks & crypto trading — market data, orders, portfolio management",
    endpoint: "https://paper-api.alpaca.markets/v2",
    endpointPlaceholder: "https://paper-api.alpaca.markets/v2",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16" />
      </svg>
    ),
    color: "#10b981",
    badge: "Trading",
    needsKey: true,
    type: "http" as ToolType,
  },
  {
    id: "playwright",
    name: "Playwright MCP",
    description: "Browser automation — navigate pages, click, fill forms, scrape data",
    endpoint: "ws://localhost:3001",
    endpointPlaceholder: "ws://localhost:3001",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path strokeLinecap="round" d="M3 9h18M9 21V9"/>
      </svg>
    ),
    color: "#f59e0b",
    badge: "Browser",
    needsKey: false,
  },
  {
    id: "shadcn",
    name: "shadcn/ui MCP",
    description: "Component library — search components, get code, add to your project",
    endpoint: "ws://localhost:3002",
    endpointPlaceholder: "ws://localhost:3002",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path strokeLinecap="round" d="M8 21h8M12 17v4"/>
      </svg>
    ),
    color: "#38bdf8",
    badge: "UI Dev",
    needsKey: false,
  },
] as const;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function CustomToolModal({
  mode,
  initialTool,
  onSave,
  onClose,
}: CustomToolModalProps) {
  const [toolType, setToolType] = useState<ToolType>(initialTool?.type ?? "http");
  const [name, setName] = useState(initialTool?.name ?? "");
  const [endpoint, setEndpoint] = useState(initialTool?.endpoint ?? "");
  const [description, setDescription] = useState(initialTool?.description ?? "");
  const [headers, setHeaders] = useState("");
  const [apiKey, setApiKey] = useState(initialTool?.apiKey ?? "");
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);

  const isValid = name.trim() && endpoint.trim();

  function applyPreset(item: typeof MCP_CATALOG[number]) {
    const type: ToolType = ("type" in item ? item.type : "mcp") as ToolType;
    setToolType(type);
    setName(item.name);
    setEndpoint(item.endpoint);
    setDescription(item.description);
    setApiKey("");
    setSelectedCatalog(item.id);
  }

  function handleSave() {
    if (!isValid) return;

    let parsedHeaders: Record<string, string> = {};
    if (headers.trim()) {
      try {
        parsedHeaders = JSON.parse(headers.trim());
      } catch {
        return;
      }
    }

    onSave({
      id: initialTool?.id ?? Date.now().toString(),
      type: toolType,
      name: name.trim(),
      description: description.trim(),
      endpoint: endpoint.trim(),
      apiKey: apiKey.trim(),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d1525] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a855f7]/20 to-[#38bdf8]/20 border border-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#a855f7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium text-[15px]">
                {mode === "add" ? "Add Custom Tool" : "Edit Tool"}
              </h3>
              <p className="text-white/40 text-[11px] mt-0.5">
                Connect any HTTP API or MCP server
              </p>
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

        {/* Quick connect catalog (add mode only) */}
        {mode === "add" && (
          <div className="mb-5">
            <p className="text-[11px] text-white/35 uppercase tracking-wider mb-2.5">Quick Connect</p>
            <div className="grid grid-cols-2 gap-2">
              {MCP_CATALOG.map(item => (
                <button
                  key={item.id}
                  onClick={() => applyPreset(item)}
                  className={`text-left rounded-xl border px-3 py-2.5 transition-all ${
                    selectedCatalog === item.id
                      ? "border-white/20 bg-white/[0.06]"
                      : "border-white/[0.07] bg-[#050810]/40 hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span style={{ color: item.color }}>{item.icon}</span>
                      <span className="text-[12px] text-white/80 font-medium">{item.name}</span>
                    </div>
                    <span
                      className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{
                        color: item.color,
                        backgroundColor: `${item.color}18`,
                        border: `1px solid ${item.color}30`,
                      }}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/30 leading-relaxed line-clamp-2">{item.description}</p>
                </button>
              ))}
            </div>
            <div className="relative mt-4 mb-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.06]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-[#0d1525] px-3 text-[10px] text-white/20 uppercase tracking-wider">or configure manually</span>
              </div>
            </div>
          </div>
        )}

        {/* Tool type toggle */}
        <div className="flex rounded-xl border border-white/10 overflow-hidden mb-5">
          {(["http", "mcp"] as ToolType[]).map(t => (
            <button
              key={t}
              onClick={() => setToolType(t)}
              className={`flex-1 py-2.5 text-[12px] font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
                toolType === t
                  ? "bg-[#a855f7]/20 text-[#a855f7] border-t-2 border-t-[#a855f7]"
                  : "text-white/35 hover:text-white/60"
              }`}
            >
              <span>{t === "http" ? <Globe size={16} /> : <Plug size={16} />}</span>
              {t === "http" ? "HTTP Tool" : "MCP Server"}
            </button>
          ))}
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* Tool Name */}
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">Tool Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Custom API"
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25"
            />
          </div>

          {/* Endpoint URL */}
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">
              {toolType === "http" ? "Endpoint URL" : "MCP Server URL"}
            </label>
            <input
              type="text"
              value={endpoint}
              onChange={e => setEndpoint(e.target.value)}
              placeholder={toolType === "http" ? "https://api.myservice.com/query" : "wss://mcp-server.example.com"}
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25 font-mono"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">
              Description <span className="text-white/25">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What this tool does"
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25"
            />
          </div>

          {/* Headers (HTTP only) */}
          {toolType === "http" && (
            <div>
              <label className="block text-[12px] text-white/50 mb-1.5">
                Headers <span className="text-white/25">(JSON, optional)</span>
              </label>
              <textarea
                value={headers}
                onChange={e => setHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer xxx"}'
                rows={3}
                className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25 resize-none font-mono"
              />
              {headers.trim() && (
                <p className="text-[10px] text-white/25 mt-1">
                  JSON parsed on save — verify format is valid
                </p>
              )}
            </div>
          )}

          {/* API Key */}
          <div>
            <label className="block text-[12px] text-white/50 mb-1.5">
              API Key <span className="text-white/25">(optional)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full bg-[#050810]/80 border border-white/10 rounded-xl px-4 py-2.5 text-white text-[13px] placeholder:text-white/20 focus:outline-none focus:border-white/25"
            />
          </div>
        </div>

        {/* Info box */}
        <div className="mt-4 rounded-xl bg-[#38bdf8]/5 border border-[#38bdf8]/15 px-4 py-3 flex gap-3">
          <svg className="h-4 w-4 text-[#38bdf8] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#38bdf8]/70 text-[12px] leading-relaxed">
            {toolType === "http"
              ? "The agent will POST job context to your endpoint and include the response in the LLM context."
              : "MCP servers expose tools via JSON-RPC. The agent will discover and call tools automatically."}
          </p>
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
            onClick={handleSave}
            disabled={!isValid}
            className="flex-1 py-2.5 rounded-xl bg-[#a855f7]/15 border border-[#a855f7]/30 text-[#a855f7] text-[13px] font-medium hover:bg-[#a855f7]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {mode === "add" ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Tool
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
