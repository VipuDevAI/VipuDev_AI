import { useState } from "react";
import { Check, Copy, GitCompare, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

interface CodeDiffProps {
  oldCode: string;
  newCode: string;
  language?: string;
  fileName?: string;
}

export function CodeDiff({ oldCode, newCode, language = "javascript", fileName }: CodeDiffProps) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"split" | "unified">("unified");

  const oldLines = oldCode.split("\n");
  const newLines = newCode.split("\n");

  const copyNewCode = () => {
    navigator.clipboard.writeText(newCode);
    setCopied(true);
    toast.success("New code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const computeDiff = () => {
    const diff: { type: "unchanged" | "added" | "removed"; content: string; lineOld?: number; lineNew?: number }[] = [];
    
    const maxLen = Math.max(oldLines.length, newLines.length);
    let oldIdx = 0;
    let newIdx = 0;

    for (let i = 0; i < maxLen; i++) {
      const oldLine = oldLines[oldIdx];
      const newLine = newLines[newIdx];

      if (oldLine === newLine) {
        diff.push({ type: "unchanged", content: oldLine || "", lineOld: oldIdx + 1, lineNew: newIdx + 1 });
        oldIdx++;
        newIdx++;
      } else if (oldLine !== undefined && !newLines.includes(oldLine)) {
        diff.push({ type: "removed", content: oldLine, lineOld: oldIdx + 1 });
        oldIdx++;
      } else if (newLine !== undefined && !oldLines.includes(newLine)) {
        diff.push({ type: "added", content: newLine, lineNew: newIdx + 1 });
        newIdx++;
      } else {
        if (oldLine !== undefined) {
          diff.push({ type: "removed", content: oldLine, lineOld: oldIdx + 1 });
          oldIdx++;
        }
        if (newLine !== undefined) {
          diff.push({ type: "added", content: newLine, lineNew: newIdx + 1 });
          newIdx++;
        }
      }
    }

    return diff;
  };

  const diff = computeDiff();
  const addedCount = diff.filter(d => d.type === "added").length;
  const removedCount = diff.filter(d => d.type === "removed").length;

  return (
    <div className="rounded-xl overflow-hidden border border-gray-700 bg-black/50">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <GitCompare className="w-4 h-4 text-lime-400" />
          <span className="text-sm font-medium text-gray-300">{fileName || "Code Changes"}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">+{addedCount}</span>
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">-{removedCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === "unified" ? "split" : "unified")}
            className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
          >
            {view === "unified" ? "Split View" : "Unified View"}
          </button>
          <button
            onClick={copyNewCode}
            className="text-xs px-2 py-1 rounded bg-lime-500/20 text-lime-400 hover:bg-lime-500/30 transition-colors flex items-center gap-1"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            Copy New
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-auto">
        {view === "unified" ? (
          <table className="w-full text-xs font-mono">
            <tbody>
              {diff.map((line, i) => (
                <tr
                  key={i}
                  className={
                    line.type === "added"
                      ? "bg-green-500/10"
                      : line.type === "removed"
                      ? "bg-red-500/10"
                      : ""
                  }
                >
                  <td className="px-2 py-0.5 text-gray-600 select-none w-10 text-right border-r border-gray-800">
                    {line.lineOld || ""}
                  </td>
                  <td className="px-2 py-0.5 text-gray-600 select-none w-10 text-right border-r border-gray-800">
                    {line.lineNew || ""}
                  </td>
                  <td className="px-2 py-0.5 w-6 text-center">
                    {line.type === "added" ? (
                      <Plus className="w-3 h-3 text-green-400 inline" />
                    ) : line.type === "removed" ? (
                      <Minus className="w-3 h-3 text-red-400 inline" />
                    ) : null}
                  </td>
                  <td
                    className={`px-2 py-0.5 whitespace-pre ${
                      line.type === "added"
                        ? "text-green-300"
                        : line.type === "removed"
                        ? "text-red-300"
                        : "text-gray-400"
                    }`}
                  >
                    {line.content}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex">
            <div className="flex-1 border-r border-gray-700">
              <div className="text-xs text-gray-500 px-2 py-1 bg-red-500/5 border-b border-gray-800">Old</div>
              <pre className="p-2 text-xs text-gray-400 whitespace-pre-wrap">{oldCode}</pre>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 px-2 py-1 bg-green-500/5 border-b border-gray-800">New</div>
              <pre className="p-2 text-xs text-gray-400 whitespace-pre-wrap">{newCode}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
