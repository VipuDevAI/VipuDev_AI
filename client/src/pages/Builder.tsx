import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import Editor from "@monaco-editor/react";
import {
  Rocket,
  Loader2,
  FolderTree,
  FileCode,
  Download,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Key,
  Sparkles,
  Zap,
  Github,
  FileText,
} from "lucide-react";

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
}

interface BuildResponse {
  rawResponse: string;
  files: GeneratedFile[];
  fileCount: number;
  model: string;
  prompt: string;
}

const PROJECT_TEMPLATES = [
  { id: "custom", label: "Custom Project", icon: "🚀" },
  { id: "school", label: "School Management System", icon: "🎓" },
  { id: "ecommerce", label: "E-Commerce Store", icon: "🛒" },
  { id: "chat", label: "Real-time Chat App", icon: "💬" },
  { id: "blog", label: "Blog Platform", icon: "📝" },
  { id: "crm", label: "CRM System", icon: "📊" },
  { id: "api", label: "REST API Backend", icon: "🔌" },
  { id: "dashboard", label: "Admin Dashboard", icon: "📈" },
];

const TECH_STACKS = [
  { id: "default", label: "Auto (Best Choice)" },
  { id: "react-node", label: "React + Node.js + PostgreSQL" },
  { id: "react-python", label: "React + FastAPI + PostgreSQL" },
  { id: "nextjs", label: "Next.js Full-Stack" },
  { id: "vue-node", label: "Vue.js + Express" },
  { id: "vanilla", label: "Vanilla JS + Express" },
];

export default function Builder() {
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("custom");
  const [techStack, setTechStack] = useState("default");
  const [apiKey, setApiKey] = useState("");
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [rawResponse, setRawResponse] = useState("");

  const buildMutation = useMutation({
    mutationFn: async () => {
      const templatePrompt = selectedTemplate !== "custom" 
        ? PROJECT_TEMPLATES.find(t => t.id === selectedTemplate)?.label + ": "
        : "";
      
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: templatePrompt + prompt,
          techStack: techStack !== "default" ? techStack : undefined,
          apiKey: apiKey || undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Build failed");
      }

      return res.json() as Promise<BuildResponse>;
    },
    onSuccess: (data) => {
      setGeneratedFiles(data.files);
      setRawResponse(data.rawResponse);
      if (data.files.length > 0) {
        setSelectedFile(data.files[0]);
        const folders = new Set<string>();
        data.files.forEach(f => {
          const parts = f.path.split("/");
          let current = "";
          parts.slice(0, -1).forEach(part => {
            current = current ? `${current}/${part}` : part;
            folders.add(current);
          });
        });
        setExpandedFolders(folders);
      }
      toast.success(`Generated ${data.fileCount} files!`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Build failed");
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/download-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: generatedFiles,
          projectName: prompt.slice(0, 30).replace(/[^\w\s]/g, "").replace(/\s+/g, "-") || "vipudev-project",
        }),
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vipudev-project.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast.success("Project downloaded!");
    },
    onError: () => {
      toast.error("Download failed");
    },
  });

  const copyContent = (content: string, path: string) => {
    navigator.clipboard.writeText(content);
    setCopiedPath(path);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  const buildFileTree = () => {
    const tree: { [key: string]: GeneratedFile[] } = {};
    const folders = new Set<string>();

    generatedFiles.forEach(file => {
      const parts = file.path.split("/");
      if (parts.length === 1) {
        if (!tree["/"]) tree["/"] = [];
        tree["/"].push(file);
      } else {
        const folder = parts.slice(0, -1).join("/");
        folders.add(folder);
        if (!tree[folder]) tree[folder] = [];
        tree[folder].push(file);
      }
    });

    return { tree, folders: Array.from(folders).sort() };
  };

  const { tree, folders } = buildFileTree();

  return (
    <div className="h-full flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500/20 to-lime-500/20 border border-lime-500/20">
              <Rocket className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold vipu-gradient flex items-center gap-2">
                VipuDevAI App Builder
                <Zap className="w-4 h-4 text-yellow-400" />
              </h2>
              <p className="text-gray-500 text-xs">Generative Developer Agent - Build complete apps instantly</p>
            </div>
          </div>

          {generatedFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const readmeFile = generatedFiles.find(f => f.path.toLowerCase() === "readme.md");
                  if (readmeFile) {
                    setSelectedFile(readmeFile);
                  }
                  toast.success("Your project is GitHub-ready! Download and push to GitHub.");
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600/50 transition-all text-sm font-medium"
                data-testid="button-github-ready"
              >
                <Github className="w-4 h-4" />
                GitHub Ready
              </button>
              <button
                onClick={() => downloadMutation.mutate()}
                disabled={downloadMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:bg-lime-500/30 transition-all text-sm font-medium"
                data-testid="button-download-project"
              >
                {downloadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download ZIP
              </button>
            </div>
          )}
        </div>

        <div className={`rounded-xl p-4 flex items-center gap-3 mb-4 ${apiKey ? "bg-lime-500/10 border border-lime-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
          <Key className={`w-5 h-5 flex-shrink-0 ${apiKey ? "text-lime-400" : "text-amber-400"}`} />
          <div className="flex-1">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key to start building..."
              className="w-full bg-transparent text-sm text-white placeholder:text-amber-400/60 focus:outline-none"
              data-testid="input-builder-api-key"
            />
            <p className={`text-xs mt-1 ${apiKey ? "text-lime-500/60" : "text-amber-500/60"}`}>
              {apiKey ? "API key set - ready to build!" : "Your key is stored locally and never shared"}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Project Template</label>
            <div className="grid grid-cols-2 gap-2">
              {PROJECT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-3 rounded-lg text-left text-sm transition-all ${
                    selectedTemplate === template.id
                      ? "bg-lime-500/20 border-lime-500/50 text-lime-400 border"
                      : "bg-black/30 border border-gray-700/50 text-gray-400 hover:border-gray-600"
                  }`}
                  data-testid={`button-template-${template.id}`}
                >
                  <span className="mr-2">{template.icon}</span>
                  {template.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Tech Stack</label>
            <select
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400/50"
              data-testid="select-tech-stack"
            >
              {TECH_STACKS.map((stack) => (
                <option key={stack.id} value={stack.id}>
                  {stack.label}
                </option>
              ))}
            </select>

            <div className="mt-4">
              <label className="block text-sm text-gray-400 mb-2">
                {selectedTemplate === "custom" ? "Describe Your App" : "Additional Details (Optional)"}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={
                  selectedTemplate === "custom"
                    ? "Describe what you want to build... e.g., 'A task management app with user authentication, projects, and team collaboration'"
                    : "Add any specific features or requirements..."
                }
                className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none h-24"
                data-testid="input-project-prompt"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => buildMutation.mutate()}
          disabled={buildMutation.isPending || (!prompt && selectedTemplate === "custom")}
          className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-green-500/20 font-semibold text-lg"
          data-testid="button-build"
        >
          {buildMutation.isPending ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Building Your App...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              <span>Build Complete Application</span>
            </>
          )}
        </button>
      </div>

      {generatedFiles.length > 0 && (
        <div className="flex-1 glass-card p-4 flex gap-4 min-h-0">
          <div className="w-64 flex-shrink-0 overflow-y-auto border-r border-gray-700/50 pr-4">
            <div className="flex items-center gap-2 mb-3 text-gray-400">
              <FolderTree className="w-4 h-4" />
              <span className="text-sm font-medium">Project Files ({generatedFiles.length})</span>
            </div>

            {tree["/"]?.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-all ${
                  selectedFile?.path === file.path
                    ? "bg-lime-500/20 text-lime-400"
                    : "text-gray-400 hover:bg-white/5"
                }`}
                data-testid={`file-${file.path}`}
              >
                <FileCode className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}

            {folders.map((folder) => (
              <div key={folder}>
                <button
                  onClick={() => toggleFolder(folder)}
                  className="w-full flex items-center gap-1 px-2 py-1.5 text-gray-400 hover:bg-white/5 rounded text-sm"
                >
                  {expandedFolders.has(folder) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <FolderTree className="w-4 h-4 text-yellow-500" />
                  <span>{folder}</span>
                </button>
                {expandedFolders.has(folder) && (
                  <div className="ml-4">
                    {tree[folder]?.map((file) => (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-all ${
                          selectedFile?.path === file.path
                            ? "bg-lime-500/20 text-lime-400"
                            : "text-gray-400 hover:bg-white/5"
                        }`}
                        data-testid={`file-${file.path}`}
                      >
                        <FileCode className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{file.path.split("/").pop()}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {selectedFile ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-gray-700/50 mb-3">
                  <div className="flex items-center gap-2 text-lime-400">
                    <FileCode className="w-4 h-4" />
                    <span className="text-sm font-mono">{selectedFile.path}</span>
                  </div>
                  <button
                    onClick={() => copyContent(selectedFile.content, selectedFile.path)}
                    className="flex items-center gap-1 px-3 py-1 rounded text-xs text-gray-400 hover:text-lime-400 hover:bg-lime-500/10 transition-all"
                  >
                    {copiedPath === selectedFile.path ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="flex-1 rounded-lg overflow-hidden border border-gray-700/50">
                  <Editor
                    height="100%"
                    language={selectedFile.language}
                    value={selectedFile.content}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 13,
                      lineNumbers: "on",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <p>Select a file to view its contents</p>
              </div>
            )}
          </div>
        </div>
      )}

      {generatedFiles.length === 0 && !buildMutation.isPending && (
        <div className="flex-1 glass-card p-8 flex flex-col items-center justify-center text-center">
          <Sparkles className="w-20 h-20 text-lime-400/30 mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">Ready to Build?</h3>
          <p className="text-gray-500 max-w-lg">
            Describe your project and VipuDevAI will generate a complete, production-ready 
            application with backend, frontend, database models, and deployment scripts.
          </p>
          <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-2xl">
            {[
              "School management with students, teachers, classes",
              "E-commerce with products, cart, checkout",
              "Real-time chat with rooms and private messages",
              "Blog with posts, comments, categories",
              "Task manager with projects and teams",
            ].map((example, i) => (
              <button
                key={i}
                onClick={() => setPrompt(example)}
                className="px-4 py-2 rounded-full text-sm bg-lime-500/10 text-lime-400 border border-lime-500/20 hover:bg-lime-500/20 hover:border-lime-500/40 transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
