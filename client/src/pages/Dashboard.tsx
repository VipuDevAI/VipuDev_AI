import { Folder, Plus, Clock, Trash2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { Project } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json() as Promise<{ projects: Project[] }>;
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim() || "Untitled Project",
          description: newProjectDesc.trim() || null,
          files: [{ path: "main.js", content: "// Start coding here...\n", language: "javascript" }],
        }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowCreateModal(false);
      setNewProjectName("");
      setNewProjectDesc("");
      toast.success("Project created!");
    },
    onError: () => {
      toast.error("Failed to create project");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
  });

  return (
    <div className="glass-card p-8 h-full flex flex-col gap-6 animate-in fade-in duration-500 relative">
      <img 
        src="/vipudev-logo.png" 
        alt="VipuDev.AI Logo" 
        className="absolute top-4 right-4 w-16 h-16 object-contain opacity-90 hover:opacity-100 transition-opacity"
        data-testid="img-logo"
      />

      <div className="flex justify-between items-center pr-20">
        <div>
          <h2 className="text-2xl font-bold vipu-gradient mb-1">Project Overview</h2>
          <p className="text-gray-400 text-sm">Manage your development projects.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
          data-testid="button-create-project"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-lime-400" />
        </div>
      ) : data?.projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Folder className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg mb-2">No projects yet</p>
          <p className="text-sm">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.projects.map((project) => (
            <div
              key={project.id}
              className="p-4 rounded-xl bg-white/5 border border-lime-500/20 hover:border-lime-400/50 hover:bg-white/10 transition-all cursor-pointer group"
              data-testid={`card-project-${project.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 rounded-lg bg-lime-500/20 text-lime-400 group-hover:text-lime-300 transition-colors">
                  <Folder className="w-6 h-6" />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete this project?")) {
                      deleteProjectMutation.mutate(project.id);
                    }
                  }}
                  className="text-gray-500 hover:text-red-400 transition-colors p-1"
                  data-testid={`button-delete-${project.id}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-semibold text-gray-200 mb-1" data-testid={`text-project-name-${project.id}`}>
                {project.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                {project.description || "No description"}
              </p>
              <div className="flex items-center text-xs text-gray-500 gap-2">
                <Clock className="w-3 h-3" />
                <span data-testid={`text-updated-${project.id}`}>
                  {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowCreateModal(true)}
            className="p-4 rounded-xl border border-dashed border-lime-500/30 flex flex-col items-center justify-center text-gray-500 hover:text-lime-400 hover:border-lime-400/60 transition-all cursor-pointer min-h-[160px]"
            data-testid="button-create-project-card"
          >
            <Plus className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">Create Project</span>
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0a1a0f] border border-lime-500/30 rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold vipu-gradient mb-4">Create New Project</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="My Awesome App"
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50"
                  data-testid="input-project-name"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-400 block mb-1">Description (optional)</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="What are you building?"
                  rows={3}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-lime-400/50 resize-none"
                  data-testid="input-project-description"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProjectName("");
                  setNewProjectDesc("");
                }}
                className="flex-1 py-2 px-4 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => createProjectMutation.mutate()}
                disabled={createProjectMutation.isPending}
                className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-r from-green-600 to-lime-500 text-white font-medium hover:from-green-500 hover:to-lime-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="button-confirm-create"
              >
                {createProjectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
