from pathlib import PurePosixPath

from app.schemas import ASTAnalysis, DependencyAnalysis, DependencyGraph, GraphEdge, GraphNode


EXCLUDED_PATH_PARTS = {
    "venv",
    ".venv",
    "env",
    "__pycache__",
    "site-packages",
    "dist-packages",
    "node_modules",
}


def build_dependency_graph(
    dependencies: list[DependencyAnalysis],
    ast_analysis: list[ASTAnalysis],
) -> DependencyGraph:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    seen_nodes: set[str] = set()
    seen_edges: set[tuple[str, str, str]] = set()
    module_paths = _module_paths(ast_analysis)
    valid_source_paths = {
        analysis.path
        for analysis in ast_analysis
        if analysis.language == "python"
        and not _is_excluded_path(analysis.path)
    }

    for dependency in dependencies:
        if dependency.source_file not in valid_source_paths:
            continue

        target_path = _resolve_target_path(
            dependency.target_module,
            module_paths,
        )
        if target_path is None:
            continue

        for node_id in (dependency.source_file, target_path):
            if node_id in seen_nodes:
                continue
            seen_nodes.add(node_id)
            nodes.append(GraphNode(id=node_id, label=node_id, node_type="file"))

        edge_key = (
            dependency.source_file,
            target_path,
            "depends_on",
        )
        if edge_key in seen_edges:
            continue
        seen_edges.add(edge_key)
        edges.append(
            GraphEdge(
                source=dependency.source_file,
                target=target_path,
            )
        )

    return DependencyGraph(nodes=nodes, edges=edges)


def _module_paths(ast_analysis: list[ASTAnalysis]) -> dict[str, list[str]]:
    module_paths: dict[str, list[str]] = {}
    for analysis in ast_analysis:
        if analysis.language != "python" or _is_excluded_path(analysis.path):
            continue

        for module_name in _module_names(analysis.path):
            module_paths.setdefault(module_name, []).append(analysis.path)
    return module_paths


def _module_names(path: str) -> list[str]:
    path_parts = list(PurePosixPath(path).with_suffix("").parts)
    if not path_parts:
        return []
    if path_parts[-1] == "__init__":
        path_parts.pop()

    module_names = [".".join(path_parts[index:]) for index in range(len(path_parts))]
    return module_names


def _resolve_target_path(
    target_module: str,
    module_paths: dict[str, list[str]],
) -> str | None:
    candidates = sorted(set(module_paths.get(target_module, [])))
    if len(candidates) != 1:
        return None
    return candidates[0]


def _is_excluded_path(path: str) -> bool:
    return any(part.lower() in EXCLUDED_PATH_PARTS for part in PurePosixPath(path).parts)