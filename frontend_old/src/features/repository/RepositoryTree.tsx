import { Folder, FolderOpen, FileText, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { RepositoryStructureItem } from '@/types';

type TreeNodeData = {
  path: string;
  type: RepositoryStructureItem['type'];
  children: Record<string, TreeNodeData>;
  isFile: boolean;
};

function buildTree(items: RepositoryStructureItem[]) {
  const root: Record<string, TreeNodeData> = {};

  items.forEach((item) => {
    const parts = item.path.split('/');
    let current = root;

    parts.forEach((part, index) => {
      const key = parts.slice(0, index + 1).join('/');
      if (!current[part]) {
        current[part] = {
          path: key,
          type: index === parts.length - 1 ? item.type : 'folder',
          children: {},
          isFile: index === parts.length - 1 && item.type === 'blob',
        };
      }
      current = current[part].children;
    });
  });

  return root;
}

function TreeNode({
  label,
  path,
  children,
  isFile,
  selected,
  onSelect,
}: {
  label: string;
  path: string;
  children?: Record<string, TreeNodeData>;
  isFile?: boolean;
  selected?: boolean;
  onSelect: (path: string) => void;
}) {
  const [expanded, setExpanded] = useState(path === '' || !isFile);
  const childEntries = children ? Object.entries(children) : [];

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          if (!isFile) setExpanded((v) => !v);
          if (path) onSelect(path);
        }}
        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition ${selected ? 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/25' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'}`}
      >
        {!isFile ? (expanded ? <FolderOpen size={14} /> : <Folder size={14} />) : <FileText size={14} />}
        <span className="truncate">{label}</span>
      </button>

      {!isFile && expanded && childEntries.length > 0 && (
        <div className="ml-3 border-l border-slate-800 pl-2">
          {childEntries.map(([childKey, child]) => (
            <TreeNode
              key={child.path}
              label={childKey}
              path={child.path}
              children={child.children}
              isFile={child.isFile}
              selected={selected && false}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RepositoryTree({ items, selectedPath, onSelect }: { items: RepositoryStructureItem[]; selectedPath?: string | null; onSelect: (path: string) => void }) {
  const [query, setQuery] = useState('');
  const tree = useMemo(() => buildTree(items), [items]);
  const rootEntries = Object.entries(tree);

  const filtered = rootEntries.filter(([key]) => key.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="panel h-full p-4">
      <div className="mb-3 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
        <Search size={14} className="text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          placeholder="Search repository tree"
        />
      </div>
      <div className="space-y-1">
        {filtered.map(([key, node]) => (
          <TreeNode
            key={node.path || key}
            label={key}
            path={node.path}
            children={node.children}
            isFile={node.isFile}
            selected={selectedPath === node.path}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
