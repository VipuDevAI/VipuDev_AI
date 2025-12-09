import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Code2, 
  MessageSquare, 
  Container, 
  Play,
  Rocket, 
  Palette, 
  Settings,
  LogOut,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/builder", icon: Zap, label: "App Builder", highlight: true },
  { href: "/editor", icon: Code2, label: "AI Coding" },
  { href: "/chat", icon: MessageSquare, label: "Chat" },
  { href: "/docker", icon: Container, label: "Code Runner" },
  { href: "/sandbox", icon: Play, label: "Live Sandbox" },
  { href: "/deploy", icon: Rocket, label: "Deploy" },
  { href: "/image", icon: Palette, label: "DALL·E" },
  { href: "/config", icon: Settings, label: "Config" },
];

interface SidebarProps {
  onLogout?: () => void;
}

export function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-[#0a1a0f]/95 backdrop-blur-xl flex flex-col p-4 gap-2 border-r border-lime-500/20 h-full">
      <div className="flex items-center gap-3 px-2 mb-6">
        <img 
          src="/vipudev-logo.png" 
          alt="VipuDev.AI" 
          className="w-10 h-10 object-contain"
        />
        <div>
          <h1 className="text-lg font-bold vipu-gradient">
            VipuDev.AI
          </h1>
          <p className="text-[10px] text-gray-500 tracking-wider">SHORT. SHARP. EXECUTE...</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const isHighlight = 'highlight' in item && item.highlight;
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "sidebar-btn group",
                isActive && "active",
                isHighlight && !isActive && "border border-lime-500/30 bg-lime-500/10"
              )}>
                <item.icon className={cn(
                  "w-5 h-5 transition-colors",
                  isActive ? "text-white" : isHighlight ? "text-yellow-400" : "text-gray-400 group-hover:text-lime-400"
                )} />
                <span className={isHighlight && !isActive ? "text-lime-400" : ""}>{item.label}</span>
                {isHighlight && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium">NEW</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-lime-500/20">
        {onLogout && (
          <button
            onClick={onLogout}
            className="sidebar-btn w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        )}
        <div className="px-3 py-2 text-xs text-gray-500">
          v1.0.0 Beta
        </div>
      </div>
    </div>
  );
}
