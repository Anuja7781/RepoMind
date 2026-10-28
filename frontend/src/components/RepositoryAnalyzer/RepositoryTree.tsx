import { useState } from "react"
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileCode, FileText, File } from "lucide-react"
import type { ASTAnalysis, DependencyAnalysis, EntityGraph, RepositoryStructureItem, SourceFile } from "@/services/analysisApi"

const LANG_COLORS: Record<string, string> = {
  tsx: "#06b6d4", ts: "#3b82f6", py: "#f59e0b", js: "#fbbf24",
  json: "#6b7280", md: "#8b5cf6", css: "#f472b6",
}

const COMPLEXITY_COLOR = (c = 0) =>
  c > 50 ? "#ef4444" : c > 25 ? "#fbbf24" : c > 10 ? "#34d399" : "#6b7280"

interface FileNode {
  id: string
  name: string
  path: string
  type: "dir" | "file"
  language?: string
  size?: number | null
  lines?: number
  complexity?: number
  children?: FileNode[]
}

function FileIcon({ node }: { node: FileNode }) {
  if (node.type === "dir") return null
  if (node.language === "md") return <FileText size={12} className="shrink-0" style={{ color: LANG_COLORS.md }} />
  if (node.language === "json") return <File size={12} className="shrink-0 text-gray-500" />
  return <FileCode size={12} className="shrink-0" style={{ color: LANG_COLORS[node.language ?? "ts"] ?? "#8b5cf6" }} />
}

function TreeNode({ node, depth = 0, selectedPath, onSelect }: { node: FileNode; depth?: number; selectedPath: string | null; onSelect: (node: FileNode) => void }) {
  const [open, setOpen] = useState(depth < 2)
  const hasChildren = node.type === "dir" && node.children && node.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-0.5 px-1 rounded-md hover:bg-white/[0.04] cursor-pointer group transition-colors"
        style={{ paddingLeft: depth * 14 + 4, backgroundColor: selectedPath === node.path ? "rgba(124,58,237,0.15)" : undefined }}
        onClick={() => node.type === "file" ? onSelect(node) : hasChildren && setOpen(o => !o)}
      >
        {/* Toggle arrow */}
        <span className="w-3 flex items-center justify-center text-gray-600">
          {hasChildren
            ? open ? <ChevronDown size={10} /> : <ChevronRight size={10} />
            : <span className="w-3" />}
        </span>

        {/* Icon */}
        {node.type === "dir"
          ? open
            ? <FolderOpen size={12} className="shrink-0 text-violet-400/70" />
            : <Folder size={12} className="shrink-0 text-violet-400/50" />
          : <FileIcon node={node} />
        }

        {/* Name */}
        <span className={`text-xs truncate ${node.type === "dir" ? "text-gray-300 font-medium" : "text-gray-400"} group-hover:text-white transition-colors`}>
          {node.name}
        </span>

        {/* File metadata */}
        {node.type === "file" && (
          <div className="ml-auto flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.lines && (
              <span className="font-mono text-xs text-gray-600">{node.lines}L</span>
            )}
            {node.complexity && node.complexity > 0 && (
              <span className="font-mono text-xs px-1 rounded" style={{ color: COMPLEXITY_COLOR(node.complexity), backgroundColor: `${COMPLEXITY_COLOR(node.complexity)}15` }}>
                cx{node.complexity}
              </span>
            )}
            {node.language && (
              <span className="font-mono text-xs" style={{ color: LANG_COLORS[node.language] ?? "#6b7280" }}>
                .{node.language}
              </span>
            )}
          </div>
        )}
      </div>

      {open && hasChildren && (
        <div>
          {node.children!.map(child => (
            <TreeNode key={child.id} node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

function languageForPath(path: string): string | undefined {
  const extension = path.split(".").pop()?.toLowerCase()
  if (!extension || extension === path.toLowerCase()) return undefined
  return extension
}

function buildFileTree(items: RepositoryStructureItem[], repositoryName: string): FileNode {
  const root: FileNode = { id: "root", name: repositoryName, path: "/", type: "dir", children: [] }

  for (const item of items) {
    const parts = item.path.split("/").filter(Boolean)
    let current = root

    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1 && item.type !== "tree"
      const path = `/${parts.slice(0, index + 1).join("/")}`
      const child = current.children?.find(node => node.name === part)

      if (child) {
        current = child
        return
      }

      const next: FileNode = {
        id: path,
        name: part,
        path,
        type: isFile ? "file" : "dir",
        language: isFile ? languageForPath(part) : undefined,
        size: isFile ? item.size : undefined,
        children: isFile ? undefined : [],
      }
      current.children?.push(next)
      current = next
    })
  }

  return root
}

export default function RepositoryTree({
  structure,
  repositoryName,
  sourceFileCount,
  dependencyCount,
  primaryLanguage,
  sourceFiles,
  astAnalyses,
  dependencies,
  entityGraph,
}: {
  structure: RepositoryStructureItem[]
  repositoryName: string
  sourceFileCount: number
  dependencyCount: number
  primaryLanguage: string
  sourceFiles: SourceFile[]
  astAnalyses: ASTAnalysis[]
  dependencies: DependencyAnalysis[]
  entityGraph: EntityGraph
}) {
  const [search, setSearch] = useState("")
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const fileTree = buildFileTree(structure, repositoryName)
  const selectedStructure = structure.find(item => `/${item.path}` === selectedPath)
  const selectedSource = sourceFiles.find(file => `/${file.path}` === selectedPath)
  const selectedAst = astAnalyses.find(ast => `/${ast.path}` === selectedPath)
  const selectedDependencies = dependencies.filter(dependency => `/${dependency.source_file}` === selectedPath)
  const dependentFiles = dependencies.filter(dependency => `/${dependency.target_module}` === selectedPath).map(dependency => dependency.source_file)
  const relatedEntities = entityGraph.nodes.filter(node => node.label === selectedPath || node.label === selectedPath?.slice(1) || node.id === selectedPath)
  const fileEntityIds = new Set(relatedEntities.map(entity => entity.id))
  const entityRelationships = entityGraph.edges.filter(edge => fileEntityIds.has(edge.source) || fileEntityIds.has(edge.target))
  const visibleStructure = search.trim()
    ? structure.filter(item => item.path.toLowerCase().includes(search.trim().toLowerCase()))
    : structure

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="mb-3">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-1.5">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#6b7280" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter files..."
            className="bg-transparent text-xs text-gray-300 placeholder-gray-600 outline-none flex-1"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: 380 }}>
        {structure.length > 0
          ? <TreeNode node={fileTree} depth={0} selectedPath={selectedPath} onSelect={node => setSelectedPath(node.path)} />
          : <div className="py-8 text-center text-xs text-gray-600">No repository structure available.</div>}
        {search.trim() && visibleStructure.length === 0 && <div className="py-3 text-center text-xs text-gray-600">No matching files.</div>}
      </div>

      {selectedPath && (
        <div className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-violet-300">File Intelligence</div>
              <div className="text-sm font-semibold text-white mt-1 break-all">{selectedPath.slice(1)}</div>
            </div>
            <button onClick={() => setSelectedPath(null)} className="text-gray-600 hover:text-gray-300 text-xs">✕</button>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div><span className="text-gray-600">Type</span><div className="text-gray-300">{selectedSource?.language ?? selectedStructure?.type ?? "Not available"}</div></div>
            <div><span className="text-gray-600">Size</span><div className="text-gray-300">{selectedStructure?.size != null ? `${selectedStructure.size} bytes` : selectedSource ? `${selectedSource.content.length} chars` : "Not available"}</div></div>
          </div>
          {selectedAst && (
            <div className="mt-3 space-y-2">
              {selectedAst.imports.length > 0 && <div><div className="text-xs text-gray-600">Imports</div><div className="text-xs text-gray-400 break-words">{selectedAst.imports.join(", ")}</div></div>}
              {selectedAst.classes.length > 0 && <div><div className="text-xs text-gray-600">Classes</div><div className="text-xs text-gray-400">{selectedAst.classes.join(", ")}</div></div>}
              {selectedAst.functions.length > 0 && <div><div className="text-xs text-gray-600">Functions</div><div className="text-xs text-gray-400">{selectedAst.functions.join(", ")}</div></div>}
              {selectedAst.class_details.length > 0 && <div><div className="text-xs text-gray-600">Methods</div><div className="text-xs text-gray-400">{selectedAst.class_details.flatMap(item => item.methods.map(method => `${item.name}.${method.name} (${method.line_number})`)).join(", ")}</div></div>}
            </div>
          )}
          {selectedDependencies.length > 0 && <div className="mt-3"><div className="text-xs text-gray-600">Dependencies</div><div className="text-xs text-gray-400 break-words">{selectedDependencies.map(item => item.target_module).join(", ")}</div></div>}
          {dependentFiles.length > 0 && <div className="mt-3"><div className="text-xs text-gray-600">Dependent files</div><div className="text-xs text-gray-400 break-words">{dependentFiles.join(", ")}</div></div>}
          {entityRelationships.length > 0 && <div className="mt-3"><div className="text-xs text-gray-600">Entity relationships</div><div className="text-xs text-gray-400">{entityRelationships.length}</div></div>}
          {!selectedSource && !selectedAst && selectedDependencies.length === 0 && dependentFiles.length === 0 && entityRelationships.length === 0 && <div className="mt-3 text-xs text-gray-600">Not available from current analysis.</div>}
        </div>
      )}

      {/* Stats bar */}
      <div className="mt-3 pt-3 border-t border-white/[0.05] flex gap-4">
        {[ [structure.length.toLocaleString(), "items"], [sourceFileCount.toLocaleString(), "source files"], [primaryLanguage, "primary"], [dependencyCount.toLocaleString(), "deps"] ].map(([v, l]) => (
          <div key={l}>
            <div className="font-mono text-xs font-bold text-violet-400">{v}</div>
            <div className="text-xs text-gray-600">{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
