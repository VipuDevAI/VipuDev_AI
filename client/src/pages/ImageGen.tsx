import { Palette, Sparkles, Image as ImageIcon, Key, Loader2, ExternalLink, Download, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export default function ImageGen() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"1024x1024" | "1792x1024" | "1024x1792">("1024x1024");
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Load saved API key from config
  useQuery({
    queryKey: ["config"],
    queryFn: async () => {
      const res = await fetch("/api/config");
      const data = await res.json();
      if (data.config?.apiKey && !openaiKey) {
        setOpenaiKey(data.config.apiKey);
      }
      return data;
    },
  });

  const handleGenerate = async () => {
    if (!openaiKey) {
      toast.error("Please enter your OpenAI API key");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setGenerating(true);
    setGeneratedImage(null);

    try {
      // Use server-side endpoint
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          size: size,
          apiKey: openaiKey,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.details || "Failed to generate image");
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      toast.success("Image generated successfully! 🎨");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vipudevai-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Image downloaded!");
    } catch {
      window.open(generatedImage, "_blank");
    }
  };

  const examplePrompts = [
    "A futuristic city at sunset with flying cars",
    "A cute robot learning to code",
    "Abstract art with vibrant colors",
    "A magical forest with glowing mushrooms"
  ];

  return (
    <div className="glass-card p-8 h-full flex flex-col animate-in fade-in duration-500 relative">
      <img 
        src="/vipudev-logo.png" 
        alt="VipuDev.AI Logo" 
        className="absolute top-4 right-4 w-14 h-14 object-contain opacity-80"
        data-testid="img-logo"
      />

      <div className="flex items-center justify-between mb-6 pr-16">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-xl border border-pink-500/20">
            <Palette className="w-6 h-6 text-pink-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              DALL·E Image Generation
              <Heart className="w-4 h-4 text-pink-400 fill-pink-400" />
            </h2>
            <p className="text-xs text-gray-500">Create stunning AI-generated images</p>
          </div>
        </div>
        <a 
          href="https://platform.openai.com/api-keys" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-pink-400 flex items-center gap-1 transition-colors"
        >
          Get OpenAI Key <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <div className="space-y-4 mb-6">
        {/* API Key Status - Only shows warning if not set */}
        {!openaiKey && (
          <div className="rounded-xl p-3 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 flex-1">OpenAI API key required. Set it in the Config page.</span>
            <a
              href="/config"
              className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
            >
              Go to Config
            </a>
          </div>
        )}

        {/* Prompt & Generate */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input 
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              className="w-full bg-black/30 border border-pink-500/20 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-pink-400/50 transition-colors"
              data-testid="input-image-prompt"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
          </div>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as any)}
            className="bg-black/30 border border-pink-500/20 rounded-xl px-3 text-sm text-white focus:outline-none focus:border-pink-400/50"
          >
            <option value="1024x1024">Square</option>
            <option value="1792x1024">Landscape</option>
            <option value="1024x1792">Portrait</option>
          </select>
          <button 
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-pink-500/20 disabled:opacity-50"
            data-testid="button-generate-image"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Generate
          </button>
        </div>

        {/* Example prompts */}
        {!generatedImage && !generating && (
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => setPrompt(p)}
                className="px-3 py-1.5 rounded-full text-xs bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Image Display */}
      <div className="flex-1 flex items-center justify-center rounded-xl bg-black/30 border border-pink-500/10 overflow-hidden">
        {generating ? (
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-pink-400 mx-auto mb-4" />
            <p className="text-gray-300 font-medium">Creating your masterpiece...</p>
            <p className="text-xs text-gray-600 mt-2">This usually takes 10-20 seconds</p>
          </div>
        ) : generatedImage ? (
          <img 
            src={generatedImage} 
            alt="Generated" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            data-testid="img-generated"
          />
        ) : (
          <div className="text-center text-gray-600">
            <ImageIcon className="w-20 h-20 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Enter a prompt and click Generate</p>
            <p className="text-xs mt-2 text-gray-700">Powered by DALL·E 3</p>
          </div>
        )}
      </div>

      {/* Download button */}
      {generatedImage && (
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={downloadImage}
            className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Download Image
          </button>
          <a 
            href={generatedImage} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-400 hover:text-white flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/5 transition-all"
          >
            Open Full Size <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
