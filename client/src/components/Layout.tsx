import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      <Sidebar onLogout={onLogout} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-lime-400/50 to-transparent opacity-50" />
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
