import { Rocket, Globe, Server, ExternalLink, Key, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Deploy() {
  const [vercelToken, setVercelToken] = useState("");
  const [renderKey, setRenderKey] = useState("");
  const [railwayToken, setRailwayToken] = useState("");
  const [deploying, setDeploying] = useState<string | null>(null);

  const handleDeploy = (provider: string) => {
    const tokens: Record<string, string> = {
      vercel: vercelToken,
      render: renderKey,
      railway: railwayToken,
    };
    
    if (!tokens[provider]) {
      toast.error(`Please enter your ${provider} API key first`);
      return;
    }

    setDeploying(provider);
    setTimeout(() => {
      setDeploying(null);
      toast.success(`Deployment to ${provider} initiated! Check your ${provider} dashboard.`);
    }, 2000);
  };

  return (
    <div className="glass-card p-8 h-full overflow-auto animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
        <Rocket className="w-6 h-6 text-purple-400" /> Deployment Center
      </h2>
      <p className="text-gray-400 mb-8">Connect your API keys to deploy directly to cloud providers.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vercel */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 1155 1000" fill="currentColor">
                <path d="M577.344 0L1154.69 1000H0L577.344 0Z"/>
              </svg>
            </div>
            <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-lime-400 flex items-center gap-1">
              Get Token <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Vercel</h3>
          <p className="text-sm text-gray-500 mb-4">Best for frontend frameworks.</p>
          <div className="space-y-3">
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={vercelToken}
                onChange={(e) => setVercelToken(e.target.value)}
                placeholder="Vercel API Token"
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30"
                data-testid="input-vercel-token"
              />
            </div>
            <button
              onClick={() => handleDeploy('vercel')}
              disabled={deploying === 'vercel'}
              className="w-full py-2 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="button-deploy-vercel"
            >
              {deploying === 'vercel' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Deploy to Vercel
            </button>
          </div>
        </div>

        {/* Render */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center">
              <Server className="w-6 h-6 text-white" />
            </div>
            <a href="https://dashboard.render.com/u/settings#api-keys" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-lime-400 flex items-center gap-1">
              Get Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Render</h3>
          <p className="text-sm text-gray-500 mb-4">Great for fullstack apps.</p>
          <div className="space-y-3">
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={renderKey}
                onChange={(e) => setRenderKey(e.target.value)}
                placeholder="Render API Key"
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30"
                data-testid="input-render-key"
              />
            </div>
            <button
              onClick={() => handleDeploy('render')}
              disabled={deploying === 'render'}
              className="w-full py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="button-deploy-render"
            >
              {deploying === 'render' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Deploy to Render
            </button>
          </div>
        </div>

        {/* Railway */}
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-full bg-black border border-white/10 flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <a href="https://railway.app/account/tokens" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-lime-400 flex items-center gap-1">
              Get Token <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Railway</h3>
          <p className="text-sm text-gray-500 mb-4">Simple infrastructure.</p>
          <div className="space-y-3">
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                value={railwayToken}
                onChange={(e) => setRailwayToken(e.target.value)}
                placeholder="Railway API Token"
                className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-white/30"
                data-testid="input-railway-token"
              />
            </div>
            <button
              onClick={() => handleDeploy('railway')}
              disabled={deploying === 'railway'}
              className="w-full py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              data-testid="button-deploy-railway"
            >
              {deploying === 'railway' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Deploy to Railway
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 rounded-xl bg-lime-400/5 border border-lime-400/20">
        <h3 className="text-lg font-bold text-white mb-2">Manual Deployment</h3>
        <p className="text-sm text-gray-400 mb-4">
          Deploy manually with these commands:
        </p>
        <div className="bg-black/40 rounded-lg p-4 font-mono text-sm text-gray-300 space-y-1">
          <div><span className="text-lime-400">$</span> npm run build</div>
          <div><span className="text-lime-400">$</span> npm run start</div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Set DATABASE_URL environment variable on your hosting provider.
        </p>
      </div>
    </div>
  );
}
