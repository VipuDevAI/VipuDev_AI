import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Code, Palette, FileCode, RefreshCw, Download, Maximize2, Minimize2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Sandbox() {
  const [html, setHtml] = useState(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VipuDev.AI Sandbox</title>
</head>
<body>
  <div class="container">
    <h1>Welcome to VipuDev.AI!</h1>
    <p>Edit HTML, CSS & JavaScript to see live preview</p>
    <button id="btn">Click Me!</button>
    <div id="output"></div>
  </div>
</body>
</html>`);

  const [css, setCss] = useState(`* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.container {
  text-align: center;
  padding: 40px;
  background: rgba(255,255,255,0.05);
  border-radius: 20px;
  border: 1px solid rgba(132, 204, 22, 0.3);
  backdrop-filter: blur(10px);
}

h1 {
  background: linear-gradient(90deg, #22c55e, #84cc16);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

p {
  color: #888;
  margin-bottom: 20px;
}

button {
  background: linear-gradient(90deg, #22c55e, #84cc16);
  border: none;
  padding: 12px 30px;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(132, 204, 22, 0.3);
}

#output {
  margin-top: 20px;
  font-size: 24px;
  color: #84cc16;
}`);

  const [js, setJs] = useState(`// JavaScript runs in the preview!
let count = 0;

document.getElementById('btn').addEventListener('click', () => {
  count++;
  document.getElementById('output').textContent = 
    'Clicked ' + count + ' time' + (count === 1 ? '' : 's') + '! 🎉';
});

console.log('VipuDev.AI Sandbox loaded!');`);

  const [activeTab, setActiveTab] = useState<"html" | "css" | "js">("html");
  const [previewVisible, setPreviewVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generatePreview = useCallback(() => {
    const doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>${css}</style>
</head>
<body>
  ${html.replace(/<!DOCTYPE html>|<html>|<\/html>|<head>[\s\S]*?<\/head>/g, '').replace(/<\/?body>/g, '')}
  <script>
    try {
      ${js}
    } catch(e) {
      console.error('Runtime Error:', e.message);
    }
  </script>
</body>
</html>`;
    
    if (iframeRef.current) {
      iframeRef.current.srcdoc = doc;
    }
  }, [html, css, js]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [html, css, js, autoRefresh, generatePreview]);

  const downloadProject = () => {
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>VipuDev.AI Project</title>
  <style>
${css}
  </style>
</head>
<body>
${html.replace(/<!DOCTYPE html>|<html>|<\/html>|<head>[\s\S]*?<\/head>/g, '').replace(/<\/?body>/g, '')}
  <script>
${js}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vipudevai-project.html";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Project downloaded!");
  };

  const tabs = [
    { id: "html", label: "HTML", icon: FileCode, color: "text-orange-400" },
    { id: "css", label: "CSS", icon: Palette, color: "text-blue-400" },
    { id: "js", label: "JavaScript", icon: Code, color: "text-yellow-400" },
  ];

  const getValue = () => {
    switch (activeTab) {
      case "html": return html;
      case "css": return css;
      case "js": return js;
    }
  };

  const setValue = (value: string) => {
    switch (activeTab) {
      case "html": setHtml(value); break;
      case "css": setCss(value); break;
      case "js": setJs(value); break;
    }
  };

  return (
    <div className={`glass-card p-4 h-full flex flex-col animate-in fade-in duration-500 ${fullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500/20 to-lime-500/20 rounded-xl border border-lime-500/20">
            <Play className="w-5 h-5 text-lime-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold vipu-gradient">Live Sandbox</h2>
            <p className="text-xs text-gray-500">Code with heart, ship with power</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg transition-all ${autoRefresh ? 'bg-lime-500/20 text-lime-400' : 'bg-gray-800 text-gray-500'}`}
            title={autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
          </button>
          <button
            onClick={() => setPreviewVisible(!previewVisible)}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
            title={previewVisible ? "Hide preview" : "Show preview"}
          >
            {previewVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-all"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={generatePreview}
            className="px-4 py-2 rounded-lg bg-lime-500/20 text-lime-400 border border-lime-500/30 hover:bg-lime-500/30 transition-all flex items-center gap-2 text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Run
          </button>
          <button
            onClick={downloadProject}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-lime-400 transition-all"
            title="Download project"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex gap-3 min-h-0 ${!previewVisible ? 'flex-col' : ''}`}>
        {/* Editor Panel */}
        <div className={`flex flex-col ${previewVisible ? 'w-1/2' : 'flex-1'}`}>
          {/* Tabs */}
          <div className="flex gap-1 mb-2 bg-black/30 p-1 rounded-lg">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-lime-500/20 text-white border border-lime-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Code Editor */}
          <textarea
            value={getValue()}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-black/50 border border-lime-500/20 rounded-xl p-4 font-mono text-sm text-gray-200 resize-none focus:outline-none focus:border-lime-400/40 transition-colors"
            spellCheck={false}
            placeholder={`Write ${activeTab.toUpperCase()} here...`}
            data-testid={`textarea-${activeTab}`}
          />
        </div>

        {/* Preview Panel */}
        {previewVisible && (
          <div className="w-1/2 flex flex-col">
            <div className="flex items-center gap-2 mb-2 px-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-500 ml-2">Live Preview</span>
            </div>
            <div className="flex-1 bg-white rounded-xl overflow-hidden border border-lime-500/20">
              <iframe
                ref={iframeRef}
                className="w-full h-full"
                sandbox="allow-scripts allow-modals"
                title="Preview"
                data-testid="iframe-preview"
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
