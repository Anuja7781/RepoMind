import { create } from 'zustand';
import type { RepositoryAnalysis, RepositorySummary } from '@/types';
import { buildRepositorySummary } from '@/services/repositoryApi';

type AnalysisState = {
  analysis: RepositoryAnalysis | null;
  summary: RepositorySummary | null;
  selectedFile: string | null;
  selectedNodeId: string | null;
  selectedEntityType: string | null;
  setAnalysis: (analysis: RepositoryAnalysis) => void;
  setSelectedFile: (path: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEntityType: (entityType: string | null) => void;
  clear: () => void;
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  analysis: null,
  summary: null,
  selectedFile: null,
  selectedNodeId: null,
  selectedEntityType: null,
  setAnalysis: (analysis) => set({ analysis, summary: buildRepositorySummary(analysis) }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setSelectedEntityType: (selectedEntityType) => set({ selectedEntityType }),
  clear: () => set({ analysis: null, summary: null, selectedFile: null, selectedNodeId: null, selectedEntityType: null }),
}));
