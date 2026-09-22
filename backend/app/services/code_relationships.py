from pathlib import PurePosixPath

from app.schemas import ASTAnalysis, DependencyAnalysis, GraphEdge
from app.services.structural_relationships import module_names_for_path


def build_code_relationships(
    ast_analysis: list[ASTAnalysis],
    dependencies: list[DependencyAnalysis],
) -> list[GraphEdge]:
    module_paths = _module_paths(ast_analysis)
    entities = _entity_index(ast_analysis)
    edges: list[GraphEdge] = []
    seen_edges: set[tuple[str, str, str]] = set()

    for analysis in ast_analysis:
        if analysis.language != "python":
            continue

        module_name = _canonical_module(analysis.path)
        if module_name is None:
            continue
        bindings = {binding.local_name: binding.qualified_name for binding in analysis.import_bindings}

        for function in analysis.function_details:
            caller_id = _function_id(function)
            for call in function.call_references:
                target_id = _resolve_call(
                    call.expression,
                    module_name,
                    None,
                    bindings,
                    entities,
                    module_paths,
                    analysis.path,
                    dependencies,
                )
                if target_id is not None:
                    _add_edge(edges, seen_edges, caller_id, target_id, "calls")

        for class_analysis in analysis.class_details:
            class_id = _class_id(class_analysis)
            for base in class_analysis.base_references:
                target_id = _resolve_class(
                    base.expression,
                    module_name,
                    bindings,
                    entities,
                    module_paths,
                    analysis.path,
                    dependencies,
                )
                if target_id is not None:
                    _add_edge(edges, seen_edges, class_id, target_id, "inherits")

            for method in class_analysis.methods:
                caller_id = _method_id(class_analysis, method)
                for call in method.call_references:
                    target_id = _resolve_call(
                        call.expression,
                        module_name,
                        class_analysis.name,
                        bindings,
                        entities,
                        module_paths,
                        analysis.path,
                        dependencies,
                    )
                    if target_id is not None:
                        _add_edge(edges, seen_edges, caller_id, target_id, "calls")

    return edges


def _entity_index(ast_analysis: list[ASTAnalysis]) -> dict[str, dict[tuple[str, ...], set[str]]]:
    index: dict[str, dict[tuple[str, ...], set[str]]] = {
        "functions": {},
        "methods": {},
        "classes": {},
    }
    for analysis in ast_analysis:
        if analysis.language != "python":
            continue
        module_name = _canonical_module(analysis.path)
        if module_name is None:
            continue
        for function in analysis.function_details:
            _index(index["functions"], (module_name, function.name), _function_id(function))
        for class_analysis in analysis.class_details:
            _index(index["classes"], (module_name, class_analysis.name), _class_id(class_analysis))
            for method in class_analysis.methods:
                _index(
                    index["methods"],
                    (module_name, class_analysis.name, method.name),
                    _method_id(class_analysis, method),
                )
    return index


def _resolve_call(
    expression: str,
    module_name: str,
    class_name: str | None,
    bindings: dict[str, str],
    entities: dict[str, dict[tuple[str, ...], set[str]]],
    module_paths: dict[str, set[str]],
    source_path: str,
    dependencies: list[DependencyAnalysis],
) -> str | None:
    parts = expression.split(".")
    if not parts:
        return None

    if parts[0] == "self" and class_name is not None and len(parts) == 2:
        return _unique(entities["methods"].get((module_name, class_name, parts[1]), set()))

    if class_name is not None and len(parts) == 2:
        local_method = entities["methods"].get((module_name, parts[0], parts[1]), set())
        if local_method:
            return _unique(local_method)

    if len(parts) == 1:
        local_function = entities["functions"].get((module_name, parts[0]), set())
        if local_function:
            return _unique(local_function)

    resolved = _resolve_symbol(
        parts,
        bindings,
        module_paths,
        source_path,
        dependencies,
    )
    if resolved is None:
        return None
    target_module, symbol_parts = resolved
    if len(symbol_parts) == 1:
        return _unique(entities["functions"].get((target_module, symbol_parts[0]), set()))
    if len(symbol_parts) == 2:
        return _unique(
            entities["methods"].get(
                (target_module, symbol_parts[0], symbol_parts[1]),
                set(),
            )
        )
    return None


def _resolve_class(
    expression: str,
    module_name: str,
    bindings: dict[str, str],
    entities: dict[str, dict[tuple[str, ...], set[str]]],
    module_paths: dict[str, set[str]],
    source_path: str,
    dependencies: list[DependencyAnalysis],
) -> str | None:
    local_class = entities["classes"].get((module_name, expression), set())
    if local_class:
        return _unique(local_class)
    resolved = _resolve_symbol(
        expression.split("."),
        bindings,
        module_paths,
        source_path,
        dependencies,
    )
    if resolved is None:
        return None
    target_module, symbol_parts = resolved
    if len(symbol_parts) != 1:
        return None
    return _unique(entities["classes"].get((target_module, symbol_parts[0]), set()))


def _resolve_symbol(
    parts: list[str],
    bindings: dict[str, str],
    module_paths: dict[str, set[str]],
    source_path: str,
    dependencies: list[DependencyAnalysis],
) -> tuple[str, list[str]] | None:
    prefix = bindings.get(parts[0])
    remaining = parts[1:]
    if prefix is not None:
        if prefix == parts[0]:
            return _resolve_module(parts, module_paths)
        if prefix.startswith("."):
            return _resolve_relative_symbol(
                prefix,
                remaining,
                source_path,
                module_paths,
                dependencies,
            )
        qualified_parts = prefix.split(".")
        resolved = _resolve_module(qualified_parts, module_paths)
        if resolved is None:
            return None
        module_name, symbol_parts = resolved
        return module_name, symbol_parts + remaining

    if parts[0] == "self":
        return None
    if parts[0].startswith("."):
        return None
    return _resolve_module(parts, module_paths)


def _resolve_module(
    parts: list[str],
    module_paths: dict[str, set[str]],
) -> tuple[str, list[str]] | None:
    for index in range(len(parts), 0, -1):
        alias = ".".join(parts[:index])
        paths = module_paths.get(alias, set())
        if len(paths) != 1:
            continue
        path = next(iter(paths))
        module_name = _canonical_module(path)
        if module_name is None:
            return None
        return module_name, parts[index:]
    return None


def _resolve_relative_module(
    imported_name: str,
    source_path: str,
    module_paths: dict[str, set[str]],
    dependencies: list[DependencyAnalysis],
) -> str | None:
    matching_dependencies = [
        dependency
        for dependency in dependencies
        if dependency.source_file == source_path
    ]
    relative_suffix = imported_name.lstrip(".")
    candidates = [
        dependency.target_module
        for dependency in matching_dependencies
        if dependency.target_module.endswith(relative_suffix)
    ]
    if len(set(candidates)) == 1:
        return _canonical_module(next(iter(module_paths[candidates[0]])))
    return None


def _resolve_relative_symbol(
    imported_name: str,
    remaining: list[str],
    source_path: str,
    module_paths: dict[str, set[str]],
    dependencies: list[DependencyAnalysis],
) -> tuple[str, list[str]] | None:
    relative_parts = imported_name.lstrip(".").split(".")
    if not relative_parts or not relative_parts[0]:
        return None

    matching_dependencies = [
        dependency
        for dependency in dependencies
        if dependency.source_file == source_path
    ]
    for length in range(len(relative_parts), 0, -1):
        suffix = relative_parts[:length]
        candidates = {
            dependency.target_module
            for dependency in matching_dependencies
            if dependency.target_module.split(".")[-length:] == suffix
        }
        if len(candidates) != 1:
            continue
        target_module = next(iter(candidates))
        target_paths = module_paths.get(target_module, set())
        if len(target_paths) != 1:
            return None
        canonical_module = _canonical_module(next(iter(target_paths)))
        if canonical_module is None:
            return None
        return canonical_module, relative_parts[length:] + remaining
    return None


def _module_paths(ast_analysis: list[ASTAnalysis]) -> dict[str, set[str]]:
    module_paths: dict[str, set[str]] = {}
    for analysis in ast_analysis:
        if analysis.language != "python":
            continue
        for module_name in module_names_for_path(analysis.path):
            module_paths.setdefault(module_name, set()).add(analysis.path)
    return module_paths


def _canonical_module(path: str) -> str | None:
    names = module_names_for_path(path)
    return names[0] if names else None


def _function_id(function) -> str:
    return f"function:{function.path}:{function.name}:{function.line_number}"


def _class_id(class_analysis) -> str:
    return f"class:{class_analysis.path}:{class_analysis.name}:{class_analysis.line_number}"


def _method_id(class_analysis, method) -> str:
    return f"method:{method.path}:{class_analysis.name}.{method.name}:{method.line_number}"


def _index(index: dict[tuple[str, ...], set[str]], key: tuple[str, ...], value: str) -> None:
    index.setdefault(key, set()).add(value)


def _unique(values: set[str]) -> str | None:
    return next(iter(values)) if len(values) == 1 else None


def _add_edge(
    edges: list[GraphEdge],
    seen_edges: set[tuple[str, str, str]],
    source: str,
    target: str,
    relationship: str,
) -> None:
    key = (source, target, relationship)
    if key in seen_edges:
        return
    seen_edges.add(key)
    edges.append(GraphEdge(source=source, target=target, relationship=relationship))