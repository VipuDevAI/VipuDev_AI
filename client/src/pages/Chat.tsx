import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Loader2, 
  Trash2, 
  Bot, 
  User, 
  Sparkles,
  Globe,
  Copy,
  Check,
  Key,
  Heart
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
  searchUsed?: boolean;
}

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Load saved API key from config
  useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.config?.apiKey) {
        setApiKey(data.config.apiKey);
      }
      return data;
    },
  });

  // Load chat history
  const { data: historyData } = useQuery({
    queryKey: ["chat-history"],
    queryFn: async () => {
      const res = await fetch("/api/chat/history?limit=100");
      return res.json();
    },
  });

  useEffect(() => {
    if (historyData?.messages) {
      setMessages(
        historyData.messages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    }
  }, [historyData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          apiKey: apiKey || undefined,
          searchEnabled,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to get response");
      }

      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          searchUsed: data.searchUsed,
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
      setMessages((prev) => prev.slice(0, -1)); // Remove loading message
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    sendMutation.mutate(userMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearHistory = async () => {
    if (!confirm("Clear all chat history?")) return;

    try {
      await fetch("/api/chat/history", { method: "DELETE" });
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      toast.success("Chat history cleared");
    } catch {
      toast.error("Failed to clear history");
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderMessage = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, i) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).split("\n");
        const language = lines[0] || "code";
        const code = lines.slice(1).join("\n");

        return (
          <div key={i} className="my-3 rounded-lg overflow-hidden bg-black/50 border border-lime-500/20">
            <div className="flex justify-between items-center px-3 py-1.5 bg-lime-500/10 text-xs text-lime-400">
              <span className="font-mono">{language}</span>
              <button
                onClick={() => copyToClipboard(code, i)}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                {copiedIndex === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-sm text-gray-300 font-mono">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return (
        <span key={i} className="whitespace-pre-wrap">
          {part}
        </span>
      );
    });
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col gap-4 animate-in fade-in duration-500 relative">
      <img 
        src="/vipudev-logo.png" 
        alt="VipuDev.AI Logo" 
        className="absolute top-4 right-4 w-14 h-14 object-contain opacity-80"
        data-testid="img-logo"
      />

      <div className="flex items-center justify-between pr-16">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-lime-500/20 border border-lime-500/20">
            <Bot className="w-6 h-6 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold vipu-gradient flex items-center gap-2">
              VipuDevAI Chat
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            </h2>
            <p className="text-gray-500 text-xs">Your empathetic AI development partner - Built with love</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchEnabled(!searchEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              searchEnabled
                ? "bg-lime-500/20 text-lime-400 border border-lime-500/30"
                : "bg-gray-800/50 text-gray-500 border border-gray-700"
            }`}
            data-testid="button-toggle-search"
          >
            <Globe className="w-3.5 h-3.5" />
            Real-time Search
          </button>
          <button
            onClick={clearHistory}
            className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            data-testid="button-clear-history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* API Key Input */}
      {!apiKey && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center gap-3">
          <Key className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key to start chatting..."
              className="w-full bg-transparent text-sm text-white placeholder:text-amber-400/60 focus:outline-none"
              data-testid="input-api-key"
            />
            <p className="text-xs text-amber-500/60 mt-1">Your key is stored locally and never shared</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <Sparkles className="w-16 h-16 mb-4 text-lime-400/30" />
            <p className="text-xl font-medium text-white">Hey machi! I'm VipuDevAI</p>
            <p className="text-sm text-gray-500 text-center max-w-lg mt-2">
              I'm here to help you code, debug, and build amazing things.
              Named after Vipu - Balaji's beloved daughter - I bring empathy and excellence to every interaction!
            </p>
            <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-xl">
              {[
                "How do I create a React hook?",
                "Debug my Python code",
                "Explain async/await simply",
                "Best practices for REST APIs",
                "Help me with database design"
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="px-4 py-2 rounded-full text-sm bg-lime-500/10 text-lime-400 border border-lime-500/20 hover:bg-lime-500/20 hover:border-lime-500/40 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-green-600 to-lime-500 text-white shadow-lg shadow-green-500/20"
                    : "bg-white/5 border border-lime-500/15 text-gray-200"
                }`}
                data-testid={`message-${msg.role}-${i}`}
              >
                {msg.searchUsed && (
                  <div className="flex items-center gap-1.5 text-xs text-lime-400 mb-2 pb-2 border-b border-lime-500/20">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Enhanced with real-time web search</span>
                  </div>
                )}
                <div className="text-sm leading-relaxed">
                  {renderMessage(msg.content)}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))
        )}

        {sendMutation.isPending && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-lime-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white/5 border border-lime-500/15 rounded-2xl p-4 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-lime-400" />
              <span className="text-sm text-gray-400">VipuDevAI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask VipuDevAI anything... (Shift+Enter for new line)"
            className="w-full bg-black/30 border border-lime-500/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none transition-colors min-h-[56px]"
            rows={1}
            data-testid="input-message"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || sendMutation.isPending}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-green-500/20 font-medium"
          data-testid="button-send"
        >
          {sendMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
