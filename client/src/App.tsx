import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useState, useEffect } from "react";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EditorPage from "./pages/Editor";
import Chat from "./pages/Chat";
import Docker from "./pages/Docker";
import Sandbox from "./pages/Sandbox";
import Deploy from "./pages/Deploy";
import ImageGen from "./pages/ImageGen";
import Config from "./pages/Config";
import Builder from "./pages/Builder";
import NotFound from "./pages/not-found";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("vipudev_auth");
    if (token) {
      fetch("/api/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          setIsAuthenticated(res.ok);
          if (!res.ok) localStorage.removeItem("vipudev_auth");
        })
        .catch(() => {
          setIsAuthenticated(false);
          localStorage.removeItem("vipudev_auth");
        });
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("vipudev_auth");
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1333]">
        <img src="/vipudev-logo.png" alt="Loading" className="w-20 h-20 animate-pulse" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <Login onLogin={() => setIsAuthenticated(true)} />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Layout onLogout={handleLogout}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/builder" component={Builder} />
          <Route path="/editor" component={EditorPage} />
          <Route path="/chat" component={Chat} />
          <Route path="/docker" component={Docker} />
          <Route path="/sandbox" component={Sandbox} />
          <Route path="/deploy" component={Deploy} />
          <Route path="/image" component={ImageGen} />
          <Route path="/config" component={Config} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
