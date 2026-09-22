from app.schemas import ASTAnalysis, DependencyAnalysis, EntityGraph, GraphEdge, GraphNode
from app.services.code_relationships import build_code_relationships
from app.services.structural_relationships import (
    build_import_relationships,
    module_names_for_path,
)


def build_entity_graph(
    ast_analysis: list[ASTAnalysis],
    dependencies: list[DependencyAnalysis] | None = None,
) -> EntityGraph:
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    seen_nodes: set[str] = set()
    seen_edges: set[tuple[str, str, str]] = set()

    for analysis in ast_analysis:
        if analysis.language != "python":
            continue

        module_names = module_names_for_path(analysis.path)
        if not module_names:
            continue

        file_id = f"file:{analysis.path}"
        module_path = module_names[0]
        module_id = f"module:{module_path}"
        _add_node(
            nodes,
            seen_nodes,
            GraphNode(id=file_id, label=analysis.path.rsplit("/", 1)[-1], node_type="file"),
        )
        _add_node(
            nodes,
            seen_nodes,
            GraphNode(id=module_id, label=module_path, node_type="module"),
        )
        _add_edge(
            edges,
            seen_edges,
            GraphEdge(source=file_id, target=module_id, relationship="contains"),
        )

        for function in analysis.function_details:
            function_id = (
                f"function:{function.path}:{function.name}:{function.line_number}"
            )
            _add_node(
                nodes,
                seen_nodes,
                GraphNode(id=function_id, label=function.name, node_type="function"),
            )
            _add_edge(
                edges,
                seen_edges,
                GraphEdge(
                    source=module_id,
                    target=function_id,
                    relationship="defines",
                ),
            )

        for class_analysis in analysis.class_details:
            class_id = (
                f"class:{class_analysis.path}:{class_analysis.name}:"
                f"{class_analysis.line_number}"
            )
            _add_node(
                nodes,
                seen_nodes,
                GraphNode(
                    id=class_id,
                    label=class_analysis.name,
                    node_type="class",
                ),
            )
            _add_edge(
                edges,
                seen_edges,
                GraphEdge(
                    source=module_id,
                    target=class_id,
                    relationship="defines",
                ),
            )

            for method in class_analysis.methods:
                method_id = (
                    f"method:{method.path}:{class_analysis.name}.{method.name}:"
                    f"{method.line_number}"
                )
                _add_node(
                    nodes,
                    seen_nodes,
                    GraphNode(
                        id=method_id,
                        label=method.name,
                        node_type="method",
                    ),
                )
                _add_edge(
                    edges,
                    seen_edges,
                    GraphEdge(
                        source=class_id,
                        target=method_id,
                        relationship="has_method",
                    ),
                )

    for edge in build_import_relationships(ast_analysis, dependencies or []):
        _add_edge(edges, seen_edges, edge)
    for edge in build_code_relationships(ast_analysis, dependencies or []):
        _add_edge(edges, seen_edges, edge)

    return EntityGraph(nodes=nodes, edges=edges)


def _add_node(
    nodes: list[GraphNode],
    seen_nodes: set[str],
    node: GraphNode,
) -> None:
    if node.id in seen_nodes:
        return
    seen_nodes.add(node.id)
    nodes.append(node)


def _add_edge(
    edges: list[GraphEdge],
    seen_edges: set[tuple[str, str, str]],
    edge: GraphEdge,
) -> None:
    edge_key = (edge.source, edge.target, edge.relationship)
    if edge_key in seen_edges:
        return
    seen_edges.add(edge_key)
    edges.append(edge)
