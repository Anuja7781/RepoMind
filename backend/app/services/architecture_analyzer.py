from pathlib import PurePosixPath
import ast
import re

from app.schemas import (
    ArchitectureAnalysis,
    ArchitectureComponent,
    ArchitectureRelationship,
    ASTAnalysis,
    DependencyAnalysis,
    SourceFile,
)


GENERIC_DIRECTORIES = {"root", "src", "app", "backend", "frontend", "public", "static", "css", "js", "templates", "components", "pages", "docs", "tests"}
EXCLUDED_PATH_PARTS = {
    "venv",
    ".venv",
    "env",
    "__pycache__",
    "site-packages",
    "dist-packages",
    "node_modules",
}


class ArchitectureAnalyzer:
    def analyze(
        self,
        ast_analysis: list[ASTAnalysis],
        dependencies: list[DependencyAnalysis],
        source_files: list[SourceFile] | None = None,
    ) -> ArchitectureAnalysis:
        files = source_files or [
            SourceFile(path=item.path, language=item.language, content="")
            for item in ast_analysis
        ]
        component_files, component_types, component_confidence = self._group_source_files(files)

        components = [
            ArchitectureComponent(
                id=self._component_id(name),
                name=name,
                component_type=component_types[name],
                files=paths,
                source_file_count=sum(1 for path in paths if self._is_source_file(path)),
                representative_path=paths[0] if paths else None,
                confidence=component_confidence[name],
            )
            for name, paths in component_files.items()
        ]
        component_for_file = {
            path: component
            for component, paths in component_files.items()
            for path in paths
        }
        module_for_path = {
            analysis.path: self._module_names(analysis.path)
            for analysis in ast_analysis
        }
        evidence: dict[tuple[str, str], list[DependencyAnalysis]] = {}
        for dependency in dependencies:
            source_component = component_for_file.get(dependency.source_file)
            target_component = next(
                (
                    component_for_file.get(path)
                    for path, names in module_for_path.items()
                    if dependency.target_module in names
                ),
                None,
            )
            if not source_component or not target_component or source_component == target_component:
                continue
            evidence.setdefault((source_component, target_component), []).append(dependency)

        architecture_relationships = [
            ArchitectureRelationship(
                source=self._component_id(source),
                target=self._component_id(target),
                source_component=source,
                target_component=target,
                evidence_count=len(items),
                evidence=items,
                label="Imports / depends on",
                confidence="high",
                supporting_files=sorted({item.source_file for item in items}),
            )
            for (source, target), items in sorted(evidence.items())
        ]

        architecture_relationships.extend(
            self._call_relationships(files, ast_analysis, component_for_file, component_types)
        )

        presentation = next((name for name, kind in component_types.items() if kind == "Presentation"), None)
        application = next((name for name, kind in component_types.items() if kind in {"Application", "API"}), None)
        if presentation and application:
            template_sources = [
                source_file.path for source_file in files
                if source_file.language == "python"
                and re.search(r"render_template|template|send_file", source_file.content, re.IGNORECASE)
            ]
            if template_sources:
                architecture_relationships.append(
                    ArchitectureRelationship(
                        source=self._component_id(application),
                        target=self._component_id(presentation),
                        source_component=application,
                        target_component=presentation,
                        relationship_type="renders",
                        label="Renders / serves",
                        evidence_count=len(template_sources),
                        confidence="high",
                        supporting_files=template_sources,
                    )
                )

        types = {component.component_type for component in components}
        pattern = "Layered application" if {"Application", "Presentation"}.issubset(types) else "Python package" if "Package" in types else "Repository structure"
        entry_point = next((path for path in (source_file.path for source_file in files) if PurePosixPath(path).name.lower() in {"main.py", "app.py", "wsgi.py", "asgi.py", "index.ts", "index.js"}), None)
        primary_language = self._primary_language(files)
        relationship_count = len(architecture_relationships)
        confidence = "high" if relationship_count and entry_point else "medium" if components else "low"
        evidence_summary = [
            f"{component.component_type} evidence in {len(component.files)} analyzed file(s)"
            for component in components
        ]
        description = self._description(components, entry_point, relationship_count)

        return ArchitectureAnalysis(
            components=components,
            relationships=architecture_relationships,
            architecture_pattern=pattern,
            confidence=confidence,
            entry_point=entry_point,
            primary_language=primary_language,
            description=description,
            evidence=evidence_summary,
            architecture_basis="Source-recovered architecture",
            documentation_available=False,
        )

    @classmethod
    def _call_relationships(
        cls,
        source_files: list[SourceFile],
        ast_analysis: list[ASTAnalysis],
        component_for_file: dict[str, str],
        component_types: dict[str, str],
    ) -> list[ArchitectureRelationship]:
        definitions: dict[str, str] = {}
        for analysis in ast_analysis:
            for function in analysis.function_details:
                definitions.setdefault(function.name, analysis.path)
            for class_analysis in analysis.class_details:
                definitions.setdefault(class_analysis.name, analysis.path)
                for method in class_analysis.methods:
                    definitions.setdefault(method.name, analysis.path)

        recovered: dict[tuple[str, str], list[DependencyAnalysis]] = {}
        for source_file in source_files:
            if source_file.language != "python" or not source_file.content:
                continue
            try:
                tree = ast.parse(source_file.content, filename=source_file.path)
            except SyntaxError:
                continue
            source_component = component_for_file.get(source_file.path)
            if not source_component:
                continue
            for node in ast.walk(tree):
                if not isinstance(node, ast.Call):
                    continue
                called_name = node.func.id if isinstance(node.func, ast.Name) else None
                target_path = definitions.get(called_name or "")
                target_component = component_for_file.get(target_path or "")
                if not called_name or not target_component or target_component == source_component:
                    continue
                key = (source_component, target_component)
                recovered.setdefault(key, []).append(
                    DependencyAnalysis(
                        source_file=source_file.path,
                        target_module=f"{target_path}:{called_name}",
                    )
                )

        return [
            ArchitectureRelationship(
                source=cls._component_id(source),
                target=cls._component_id(target),
                source_component=source,
                target_component=target,
                relationship_type="calls",
                label="Calls / uses",
                evidence_count=len(items),
                evidence=items,
                confidence="high",
                supporting_files=sorted({item.source_file for item in items}),
            )
            for (source, target), items in sorted(recovered.items())
        ]

    @staticmethod
    def _group_source_files(source_files: list[SourceFile]) -> tuple[dict[str, list[str]], dict[str, str], dict[str, str]]:
        eligible = [
            source_file for source_file in source_files
            if not any(part.lower() in EXCLUDED_PATH_PARTS for part in PurePosixPath(source_file.path).parts)
        ]
        component_files: dict[str, list[str]] = {}
        component_types: dict[str, str] = {}
        confidence: dict[str, str] = {}
        for source_file in eligible:
            component, component_type, level_confidence = ArchitectureAnalyzer._classify_file(source_file)
            component_files.setdefault(component, []).append(source_file.path)
            component_types[component] = component_type
            confidence[component] = level_confidence
        return component_files, component_types, confidence

    @staticmethod
    def _classify_file(source_file: SourceFile) -> tuple[str, str, str]:
        path = PurePosixPath(source_file.path)
        parts = {part.lower() for part in path.parts[:-1]}
        filename = path.name.lower()
        content = source_file.content.lower()
        if "test" in parts or "tests" in parts or filename.startswith("test_") or filename.endswith("_test.py"):
            return "Tests", "Tests", "high"
        if "docs" in parts or "documentation" in parts:
            return "Documentation", "Documentation", "high"
        if "template" in parts or "static" in parts or "public" in parts or "components" in parts or "pages" in parts or "frontend" in parts or source_file.language in {"html", "css"}:
            return "Presentation", "Presentation", "high"
        if any(token in parts or token in filename for token in {"route", "routes", "router", "routers", "api", "view", "views", "controller"}):
            return "API", "API", "high"
        if filename in {"main.py", "app.py", "wsgi.py", "asgi.py", "index.ts", "index.js"}:
            return "Application", "Application", "high"
        if any(token in parts for token in {"ml", "training", "inference"}) or any(token in filename for token in {"model", "predict"}) or any(token in content for token in {"torch", "tensorflow", "sklearn", "load_model", "predict("}):
            return "ML / Processing", "ML / Processing", "medium"
        if any(token in parts or token in filename for token in {"service", "services", "worker", "task", "processing"}):
            return "Services", "Services", "high"
        if any(token in parts or token in filename for token in {"data", "database", "db", "model", "models", "schema", "schemas", "repository", "repositories"}):
            return "Data", "Data", "high"
        if filename in {"config.py", "configuration.py", "settings.py", ".env"} or "config" in parts:
            return "Configuration", "Configuration", "high"
        package = next((part for part in reversed(path.parts[:-1]) if part.lower() not in GENERIC_DIRECTORIES), None)
        return (package or "Package"), "Package", "medium"

    @staticmethod
    def _is_source_file(path: str) -> bool:
        return PurePosixPath(path).suffix.lower() in {".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".c", ".cpp", ".h"}

    @staticmethod
    def _component_id(name: str) -> str:
        return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "component"

    @staticmethod
    def _primary_language(source_files: list[SourceFile]) -> str | None:
        counts: dict[str, int] = {}
        for source_file in source_files:
            counts[source_file.language] = counts.get(source_file.language, 0) + 1
        return max(counts, key=counts.get) if counts else None

    @staticmethod
    def _description(components: list[ArchitectureComponent], entry_point: str | None, relationships: int) -> str:
        names = ", ".join(component.name for component in components[:4])
        entry = f" Entry point: {entry_point}." if entry_point else ""
        return f"The analyzed repository contains {names or 'no confidently classified regions'}. {relationships} evidence-backed architectural relationship(s) were recovered.{entry}"

    @staticmethod
    def _module_names(path: str) -> list[str]:
        parts = list(PurePosixPath(path).with_suffix("").parts)
        if parts and parts[-1] == "__init__":
            parts.pop()
        return [".".join(parts[index:]) for index in range(len(parts))]
