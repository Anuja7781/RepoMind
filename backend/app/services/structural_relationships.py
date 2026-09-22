from pathlib import PurePosixPath

from app.schemas import ASTAnalysis, DependencyAnalysis, GraphEdge


def build_import_relationships(
    ast_analysis: list[ASTAnalysis],
    dependencies: list[DependencyAnalysis],
) -> list[GraphEdge]:
    module_paths = _module_paths(ast_analysis)
    canonical_modules = {
        analysis.path: _canonical_module_name(analysis.path)
        for analysis in ast_analysis
        if analysis.language == "python"
        and _canonical_module_name(analysis.path) is not None
    }
    edges: list[GraphEdge] = []
    seen_edges: set[tuple[str, str, str]] = set()

    for dependency in dependencies:
        source_module = canonical_modules.get(dependency.source_file)
        target_paths = module_paths.get(dependency.target_module, set())
        if source_module is None or len(target_paths) != 1:
            continue

        target_module = canonical_modules.get(next(iter(target_paths)))
        if target_module is None:
            continue

        edge = GraphEdge(
            source=f"module:{source_module}",
            target=f"module:{target_module}",
            relationship="imports",
        )
        edge_key = (edge.source, edge.target, edge.relationship)
        if edge_key in seen_edges:
            continue
        seen_edges.add(edge_key)
        edges.append(edge)

    return edges


def module_names_for_path(path: str) -> list[str]:
    path_parts = list(PurePosixPath(path).with_suffix("").parts)
    if not path_parts:
        return []
    if path_parts[-1] == "__init__":
        path_parts.pop()

    return [".".join(path_parts[index:]) for index in range(len(path_parts))]


def _canonical_module_name(path: str) -> str | None:
    module_names = module_names_for_path(path)
    return module_names[0] if module_names else None


def _module_paths(ast_analysis: list[ASTAnalysis]) -> dict[str, set[str]]:
    module_paths: dict[str, set[str]] = {}
    for analysis in ast_analysis:
        if analysis.language != "python":
            continue

        for module_name in module_names_for_path(analysis.path):
            module_paths.setdefault(module_name, set()).add(analysis.path)

    return module_paths