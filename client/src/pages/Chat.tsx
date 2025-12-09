import { useState, useRef, useEffect, useCallback } from "react";
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
  Heart,
  Mic,
  MicOff,
  BookOpen,
  Bug,
  Lightbulb,
  Code,
  Search,
  ExternalLink,
  ChevronRight,
  Zap,
  Brain
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Message {
  role: "user" | "assistant";
  content: string;
  searchUsed?: boolean;
  mode?: ChatMode;
}

interface SearchResult {
  query: string;
  rewrittenQuery: string;
  intent: string;
  reasoning: string;
  answer: string;
  keyPoints: string[];
  sources: { title: string; snippet: string; url?: string }[];
  aiSources: string[];
  confidence: number;
  followUpQuestions: string[];
}

type ChatMode = "chat" | "explain" | "debug" | "learn" | "search";

const CHAT_MODES = [
  { id: "chat" as ChatMode, label: "Chat", icon: Sparkles, color: "lime" },
  { id: "search" as ChatMode, label: "Search", icon: Search, color: "cyan" },
  { id: "explain" as ChatMode, label: "Explain Code", icon: BookOpen, color: "blue" },
  { id: "debug" as ChatMode, label: "Debug", icon: Bug, color: "red" },
  { id: "learn" as ChatMode, label: "Learn", icon: Lightbulb, color: "yellow" },
];

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [searchEnabled, setSearchEnabled] = useState(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>("chat");
  const [isListening, setIsListening] = useState(false);
  const [codeContext, setCodeContext] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const recognitionRef = useRef<any>(null);

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => prev + " " + transcript);
        setIsListening(false);
        toast.success("Voice input captured!");
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error("Voice input failed. Try again.");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) {
      toast.error("Voice input not supported in this browser");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Listening... Speak now!");
    }
  }, [isListening]);

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

  const getModePrefix = (mode: ChatMode): string => {
    switch (mode) {
      case "explain":
        return "[CODE EXPLANATION MODE] Please explain this code step-by-step in simple terms. Break down each part and explain what it does:\n\n";
      case "debug":
        return "[DEBUG MODE] I have an error or bug. Please analyze the following and help me fix it. Identify the problem, explain why it occurs, and provide the corrected code:\n\n";
      case "learn":
        return "[LEARNING MODE] Please teach me about this topic in a beginner-friendly way. Use examples, analogies, and simple explanations:\n\n";
      default:
        return "";
    }
  };

  const sendMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const modePrefix = getModePrefix(chatMode);
      const fullMessage = modePrefix + userMessage + (codeContext ? `\n\nCode context:\n\`\`\`\n${codeContext}\n\`\`\`` : "");
      
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: fullMessage }],
          apiKey: apiKey || undefined,
          searchEnabled,
          mode: chatMode,
          codeContext: codeContext || undefined,
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
          mode: chatMode,
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      if (chatMode !== "chat") {
        setCodeContext(""); // Clear code context after use
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send message");
      setMessages((prev) => prev.slice(0, -1));
    },
  });

  const handleIntelligentSearch = async (query: string) => {
    setIsSearching(true);
    setSearchResult(null);
    
    try {
      const res = await fetch("/api/assistant/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Search failed");
      }

      const data = await res.json();
      setSearchResult(data);
      
      // Persist search query to chat history for continuity
      try {
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "user", content: `[SEARCH] ${query}` }),
        });
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: `[SEARCH RESULT]\n${data.answer || "Search completed."}` }),
        });
        queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      } catch {}
    } catch (error: any) {
      toast.error(error.message || "Search failed");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");

    if (chatMode === "search") {
      // Add user message to messages for display consistency
      setMessages((prev) => [...prev, { role: "user", content: `🔍 ${userMessage}`, mode: "search" }]);
      handleIntelligentSearch(userMessage);
      return;
    }

    setMessages((prev) => [...prev, { role: "user", content: userMessage, mode: chatMode }]);
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

      {/* Chat Mode Selector */}
      <div className="flex gap-2 flex-wrap">
        {CHAT_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setChatMode(mode.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              chatMode === mode.id
                ? `bg-${mode.color}-500/20 text-${mode.color}-400 border border-${mode.color}-500/30`
                : "bg-gray-800/50 text-gray-500 border border-gray-700 hover:border-gray-600"
            }`}
            style={{
              backgroundColor: chatMode === mode.id ? `var(--${mode.color}-bg, rgba(132, 204, 22, 0.2))` : undefined,
              color: chatMode === mode.id ? `var(--${mode.color}-text, #a3e635)` : undefined,
            }}
            data-testid={`button-mode-${mode.id}`}
          >
            <mode.icon className="w-3.5 h-3.5" />
            {mode.label}
          </button>
        ))}
      </div>

      {/* Code Context for Explain/Debug modes */}
      {(chatMode === "explain" || chatMode === "debug") && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">
              {chatMode === "explain" ? "Paste code to explain:" : "Paste code with error:"}
            </span>
          </div>
          <textarea
            value={codeContext}
            onChange={(e) => setCodeContext(e.target.value)}
            placeholder={chatMode === "explain" ? "Paste your code here..." : "Paste the code that's causing the error..."}
            className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm font-mono text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none h-24"
            data-testid="input-code-context"
          />
        </div>
      )}

      {/* API Key Input */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${apiKey ? "bg-lime-500/10 border border-lime-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
        <Key className={`w-5 h-5 flex-shrink-0 ${apiKey ? "text-lime-400" : "text-amber-400"}`} />
        <div className="flex-1">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OpenAI API key to start chatting..."
            className="w-full bg-transparent text-sm text-white placeholder:text-amber-400/60 focus:outline-none"
            data-testid="input-api-key"
          />
          <p className={`text-xs mt-1 ${apiKey ? "text-lime-500/60" : "text-amber-500/60"}`}>
            {apiKey ? "API key set - ready to chat!" : "Your key is stored locally and never shared"}
          </p>
        </div>
        {apiKey && (
          <button
            onClick={() => setApiKey("")}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Perplexity-style Search Results */}
      {chatMode === "search" && (isSearching || searchResult) && (
        <div className="flex-1 overflow-y-auto pr-2">
          {isSearching && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <Brain className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-center">
                <p className="text-cyan-400 font-medium">Analyzing your question...</p>
                <p className="text-gray-500 text-sm">Searching, reasoning, synthesizing</p>
              </div>
            </div>
          )}

          {searchResult && !isSearching && (
            <div className="space-y-4">
              {/* Query Info */}
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-400">Query Analysis</span>
                  <span className="ml-auto text-xs text-gray-500">
                    {Math.round((searchResult.confidence || 0.8) * 100)}% confidence
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-1">
                  <span className="text-gray-500">Intent: </span>
                  {searchResult.intent}
                </p>
                {searchResult.rewrittenQuery !== searchResult.query && (
                  <p className="text-xs text-gray-500">
                    <span className="text-gray-600">Optimized query: </span>
                    {searchResult.rewrittenQuery}
                  </p>
                )}
              </div>

              {/* Reasoning */}
              {searchResult.reasoning && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Reasoning</span>
                  </div>
                  <p className="text-sm text-gray-300">{searchResult.reasoning}</p>
                </div>
              )}

              {/* Main Answer */}
              <div className="bg-white/5 border border-lime-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bot className="w-5 h-5 text-lime-400" />
                  <span className="font-medium text-lime-400">Answer</span>
                </div>
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {searchResult.answer}
                </div>
              </div>

              {/* Key Points */}
              {searchResult.keyPoints && searchResult.keyPoints.length > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Key Points</span>
                  </div>
                  <ul className="space-y-2">
                    {searchResult.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sources */}
              {searchResult.sources && searchResult.sources.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-400">Sources</span>
                  </div>
                  <div className="space-y-2">
                    {searchResult.sources.slice(0, 5).map((source, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-gray-500 font-mono text-xs w-5">[{i + 1}]</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-medium">{source.title}</span>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 hover:text-cyan-400"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs line-clamp-2">{source.snippet}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Questions */}
              {searchResult.followUpQuestions && searchResult.followUpQuestions.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-400">Related Questions</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchResult.followUpQuestions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(q);
                          handleIntelligentSearch(q);
                        }}
                        className="px-3 py-1.5 text-xs bg-gray-700/50 text-gray-300 rounded-lg hover:bg-cyan-500/20 hover:text-cyan-400 transition-all border border-gray-600 hover:border-cyan-500/30"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages (hidden when in search mode with results) */}
      {!(chatMode === "search" && (isSearching || searchResult)) && (
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
      )}

      {/* Input */}
      <div className="flex gap-3">
        <button
          onClick={toggleVoice}
          className={`p-3 rounded-xl transition-all ${
            isListening
              ? "bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse"
              : "bg-gray-800/50 text-gray-400 border border-gray-700 hover:text-lime-400 hover:border-lime-500/30"
          }`}
          data-testid="button-voice"
          title={isListening ? "Stop listening" : "Voice input"}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={
              chatMode === "search" ? "Ask anything... I'll search, analyze, and synthesize an answer" :
              chatMode === "explain" ? "Ask about the code above..." :
              chatMode === "debug" ? "Describe the error you're seeing..." :
              chatMode === "learn" ? "What would you like to learn about?" :
              "Ask VipuDevAI anything... (Shift+Enter for new line)"
            }
            className="w-full bg-black/30 border border-lime-500/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none transition-colors min-h-[56px]"
            rows={1}
            data-testid="input-message"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!input.trim() || sendMutation.isPending || isSearching}
          className={`px-5 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg font-medium ${
            chatMode === "search" 
              ? "bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 shadow-cyan-500/20"
              : "bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 shadow-green-500/20"
          } text-white`}
          data-testid="button-send"
        >
          {(sendMutation.isPending || isSearching) ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : chatMode === "search" ? (
            <Search className="w-5 h-5" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
