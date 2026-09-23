export type RepositoryStructureItem = {
  path: string;
  type: string;
  size?: number | null;
};

export type SourceFile = {
  path: string;
  language: string;
  content: string;
};

export type FunctionAnalysis = {
  name: string;
  path: string;
  line_number: number;
  parameters: string[];
};

export type ClassAnalysis = {
  name: string;
  path: string;
  line_number: number;
  methods: FunctionAnalysis[];
};

export type ASTAnalysis = {
  path: string;
  language: string;
  imports: string[];
  classes: string[];
  functions: string[];
  function_details: FunctionAnalysis[];
  class_details: ClassAnalysis[];
};

export type DependencyAnalysis = {
  source_file: string;
  target_module: string;
};

export type GraphNode = {
  id: string;
  label: string;
  node_type: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  relationship: string;
};

export type DependencyGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type EntityGraph = DependencyGraph;

export type ArchitectureComponent = {
  name: string;
  component_type: string;
  files: string[];
};

export type ArchitectureAnalysis = {
  components: ArchitectureComponent[];
  relationships: DependencyAnalysis[];
};

export type RepositoryAnalysis = {
  name: string;
  owner: string;
  description?: string | null;
  default_branch: string;
  stars: number;
  forks: number;
  repository_size: number;
  languages: Record<string, number>;
  structure: RepositoryStructureItem[];
  source_files: SourceFile[];
  ast_analysis: ASTAnalysis[];
  dependency_analysis: DependencyAnalysis[];
  dependency_graph: DependencyGraph;
  entity_graph: EntityGraph;
  architecture_analysis: ArchitectureAnalysis;
};

export type RepositorySummary = {
  name: string;
  owner: string;
  description?: string | null;
  default_branch: string;
  languages: Record<string, number>;
  total_files: number;
  total_classes: number;
  total_functions: number;
  total_methods: number;
  total_imports: number;
  total_dependencies: number;
  structure: RepositoryStructureItem[];
  ast_analysis: ASTAnalysis[];
  dependency_analysis: DependencyAnalysis[];
  dependency_graph: DependencyGraph;
  entity_graph: EntityGraph;
  architecture_analysis: ArchitectureAnalysis;
};
