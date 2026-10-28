from collections import Counter

from app.schemas import MetricsAnalysis, RepositoryAnalysis


def build_metrics(analysis: RepositoryAnalysis) -> MetricsAnalysis:
    source_files = len(analysis.source_files)
    ast_files = len(analysis.ast_analysis)
    entity_count = len(analysis.entity_graph.nodes)
    relationship_count = len(analysis.entity_graph.edges)
    function_count = sum(len(item.functions) for item in analysis.ast_analysis)
    class_count = sum(len(item.classes) for item in analysis.ast_analysis)
    method_count = sum(len(methods) for item in analysis.ast_analysis for class_item in item.class_details for methods in [class_item.methods])
    import_count = sum(len(item.imports) for item in analysis.ast_analysis)
    return MetricsAnalysis(
        total_repository_items=len(analysis.structure), source_files=source_files, ast_analyzed_files=ast_files,
        dependency_edges=len(analysis.dependency_graph.edges), entity_nodes=entity_count, entity_relationships=relationship_count,
        architecture_components=len(analysis.architecture_analysis.components), architecture_relationships=len(analysis.architecture_analysis.relationships),
        language_file_counts=dict(Counter(file.language for file in analysis.source_files)),
        file_type_counts=dict(Counter(item.path.rsplit(".", 1)[-1].lower() if "." in item.path.rsplit("/", 1)[-1] else item.type for item in analysis.structure if item.type == "blob")),
        directory_count=sum(item.type == "tree" for item in analysis.structure), total_functions=function_count, total_classes=class_count,
        total_methods=method_count, total_imports=import_count, ast_coverage_percent=round(ast_files / source_files * 100, 2) if source_files else None,
        dependency_density=round(len(analysis.dependency_graph.edges) / source_files, 3) if source_files else None,
        average_entity_degree=round(relationship_count / entity_count, 3) if entity_count else None,
        architecture_connectivity=round(len(analysis.architecture_analysis.relationships) / len(analysis.architecture_analysis.components), 3) if analysis.architecture_analysis.components else None,
        stars=analysis.stars, forks=analysis.forks, repository_size=analysis.repository_size, default_branch=analysis.default_branch, owner=analysis.owner, name=analysis.name,
    )