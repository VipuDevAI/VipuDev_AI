import { Save, Key, Globe, Shield, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserConfig } from "@shared/schema";
import { toast } from "sonner";

export default function Config() {
  const [backendUrl, setBackendUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error("Failed to fetch config");
      return res.json() as Promise<{ config: UserConfig }>;
    },
  });

  useEffect(() => {
    if (data?.config) {
      setBackendUrl(data.config.backendUrl || "");
      setApiKey(data.config.apiKey || "");
    }
  }, [data]);

  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backendUrl, apiKey }),
      });
      if (!res.ok) throw new Error("Failed to save config");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config"] });
      toast.success("Configuration saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save configuration");
    },
  });

  return (
    <div className="glass-card p-8 max-w-2xl mx-auto w-full mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
        <Shield className="w-6 h-6 text-gray-400" /> Configuration
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Backend URL
            </label>
            <input
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:5000"
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors font-mono text-sm"
              data-testid="input-backend-url"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Key className="w-4 h-4" /> API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-vipu-xxxxxxxxxxxx"
              className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors font-mono text-sm"
              data-testid="input-api-key"
            />
          </div>

          <div className="pt-4">
            <button
              onClick={() => saveConfigMutation.mutate()}
              disabled={saveConfigMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 hover:scale-[1.02] disabled:opacity-50"
              data-testid="button-save-config"
            >
              {saveConfigMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveConfigMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
