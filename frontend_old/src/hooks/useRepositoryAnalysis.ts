import { useMutation } from '@tanstack/react-query';
import { analyzeRepository } from '@/services/analysisApi';

export function useRepositoryAnalysis() {
  return useMutation({
    mutationFn: analyzeRepository,
  });
}
