import type { RepositoryAnalysis } from '@/types';

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function analyzeRepository(repositoryUrl: string): Promise<RepositoryAnalysis> {
  const response = await globalThis.fetch(`${BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ repository_url: repositoryUrl }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Repository analysis failed');
  }

  return response.json();
}
