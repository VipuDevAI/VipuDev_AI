import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2, Lock, User } from "lucide-react";
import { toast } from "sonner";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error("Please enter username and password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      localStorage.setItem("vipudev_auth", data.token);
      toast.success("Welcome to VipuDev.AI!");
      onLogin();
      setLocation("/");
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{
      background: "linear-gradient(135deg, #0a1a0f 0%, #0f2a15 50%, #0a1a0f 100%)",
    }}>
      <div 
        className="absolute inset-0 opacity-40"
        style={{
          background: "radial-gradient(ellipse at 70% 20%, rgba(132, 204, 22, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 30% 80%, rgba(34, 197, 94, 0.12) 0%, transparent 50%)"
        }}
      />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <img 
            src="/vipudev-logo.png" 
            alt="VipuDev.AI" 
            className="w-32 h-32 mx-auto mb-4 object-contain"
            data-testid="img-login-logo"
          />
          <h1 className="text-3xl font-bold vipu-gradient">
            VipuDev.AI
          </h1>
          <p className="text-gray-500 text-sm mt-1 tracking-widest">SHORT. SHARP. MEMORABLE.</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-bold text-white text-center mb-6">Sign In</h2>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-2">Username</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 transition-colors"
                  data-testid="input-username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-black/30 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 transition-colors"
                  data-testid="input-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-4 bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-900/30 disabled:opacity-50"
              data-testid="button-login"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          VipuDev.AI Studio v1.0.0
        </p>
      </div>
    </div>
  );
}
