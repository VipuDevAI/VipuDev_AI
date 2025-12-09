import { Container, Play, Terminal, Loader2, Code, Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Docker() {
  const [code, setCode] = useState(`// Welcome to VipuDevAI Code Runner!
// Write JavaScript or Python code and click Run

console.log("Hello from VipuDev.AI! 💚");

// Example: Calculate factorial
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log("Factorial of 5:", factorial(5));
console.log("Factorial of 10:", factorial(10));
`);
  const [language, setLanguage] = useState<"javascript" | "python">("javascript");
  const [output, setOutput] = useState<string[]>([]);

  const runCodeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to run code");
      }
      return res.json();
    },
    onSuccess: (data) => {
      const lines: string[] = [];
      lines.push(`$ Running ${language} code...`);
      lines.push("");
      
      if (data.stdout) {
        lines.push(...data.stdout.split("\n").filter((l: string) => l.trim()));
      }
      if (data.stderr) {
        lines.push("");
        lines.push("⚠️ Errors:");
        lines.push(...data.stderr.split("\n").filter((l: string) => l.trim()));
      }
      
      lines.push("");
      lines.push(`✅ Exit code: ${data.exitCode}`);
      
      setOutput(lines);
      
      if (data.success) {
        toast.success("Code executed successfully!");
      } else {
        toast.error("Code execution failed");
      }
    },
    onError: (error: any) => {
      setOutput([`❌ Error: ${error.message}`]);
      toast.error("Failed to run code");
    },
  });

  const downloadCode = () => {
    const ext = language === "python" ? ".py" : ".js";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vipudevai-code${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Code downloaded!");
  };

  const clearOutput = () => {
    setOutput([]);
  };

  const pythonExample = `# Welcome to VipuDevAI Code Runner!
# Write Python code and click Run

print("Hello from VipuDev.AI! 💚")

# Example: Fibonacci sequence
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print("Fibonacci sequence:")
for i in range(10):
    print(f"  fib({i}) = {fibonacci(i)}")
`;

  const handleLanguageChange = (newLang: "javascript" | "python") => {
    setLanguage(newLang);
    if (newLang === "python" && code.includes("console.log")) {
      setCode(pythonExample);
    } else if (newLang === "javascript" && code.includes("print(")) {
      setCode(`// Welcome to VipuDevAI Code Runner!
console.log("Hello from VipuDev.AI! 💚");
`);
    }
  };

  return (
    <div className="glass-card p-6 h-full flex flex-col animate-in fade-in duration-500 relative">
      <img 
        src="/vipudev-logo.png" 
        alt="VipuDev.AI Logo" 
        className="absolute top-4 right-4 w-14 h-14 object-contain opacity-80"
        data-testid="img-logo"
      />

      <div className="flex items-center justify-between mb-4 pr-16">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-green-500/20 to-lime-500/20 rounded-xl border border-lime-500/20">
            <Container className="w-6 h-6 text-lime-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold vipu-gradient">Code Runner</h2>
            <p className="text-xs text-gray-500">Execute JavaScript & Python code</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as "javascript" | "python")}
            className="bg-black/30 border border-lime-500/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime-400/50"
            data-testid="select-language"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>
          <button
            onClick={downloadCode}
            className="p-2 rounded-lg text-gray-400 hover:text-lime-400 hover:bg-lime-500/10 transition-all"
            title="Download code"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => runCodeMutation.mutate()}
            disabled={runCodeMutation.isPending}
            className="bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-green-500/20 flex items-center gap-2 disabled:opacity-50"
            data-testid="button-run-code"
          >
            {runCodeMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            Run Code
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Code className="w-3.5 h-3.5 text-lime-400" />
            <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Code Editor</label>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 bg-black/50 border border-lime-500/20 rounded-xl p-4 font-mono text-sm text-gray-200 resize-none focus:outline-none focus:border-lime-400/40 transition-colors"
            placeholder="Write your code here..."
            spellCheck={false}
            data-testid="textarea-code-input"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-lime-400" />
              <label className="text-xs text-gray-400 uppercase tracking-wider font-medium">Output</label>
            </div>
            {output.length > 0 && (
              <button
                onClick={clearOutput}
                className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 bg-black/50 rounded-xl border border-lime-500/20 p-4 font-mono text-sm overflow-auto">
            {output.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600">
                <Terminal className="w-10 h-10 mb-3 opacity-30" />
                <p>Click "Run Code" to execute</p>
                <p className="text-xs mt-1 text-gray-700">Output will appear here</p>
              </div>
            ) : (
              <div className="space-y-0.5 text-gray-300">
                {output.map((line, i) => (
                  <div 
                    key={i} 
                    className={
                      line.startsWith('$') ? 'text-lime-400 font-bold' : 
                      line.startsWith('✅') ? 'text-green-400' : 
                      line.startsWith('❌') ? 'text-red-400' : 
                      line.startsWith('⚠️') ? 'text-amber-400' : 
                      ''
                    }
                  >
                    {line || '\u00A0'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 rounded-xl bg-lime-500/5 border border-lime-500/15 text-xs text-gray-400">
        <strong className="text-lime-400">VipuDevAI Runner:</strong> Execute JavaScript and Python code directly in the browser. Code runs on the server in a sandboxed environment.
      </div>
    </div>
  );
}
