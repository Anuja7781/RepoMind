import type { RepositoryAnalysis } from '@/types';

export function buildRepositorySummary(data: RepositoryAnalysis) {
  const allClasses = data.ast_analysis.flatMap((item) => item.class_details.map((cls) => cls.name));
  const allFunctions = data.ast_analysis.flatMap((item) => item.function_details.map((fn) => fn.name));
  const allMethods = data.ast_analysis.flatMap((item) => item.class_details.flatMap((cls) => cls.methods.map((method) => method.name)));
  const imports = data.ast_analysis.flatMap((item) => item.imports);

  return {
    name: data.name,
    owner: data.owner,
    description: data.description,
    default_branch: data.default_branch,
    languages: data.languages,
    total_files: data.source_files.length,
    total_classes: allClasses.length,
    total_functions: allFunctions.length,
    total_methods: allMethods.length,
    total_imports: imports.length,
    total_dependencies: data.dependency_analysis.length,
    structure: data.structure,
    ast_analysis: data.ast_analysis,
    dependency_analysis: data.dependency_analysis,
    dependency_graph: data.dependency_graph,
    entity_graph: data.entity_graph,
    architecture_analysis: data.architecture_analysis,
  };
}
