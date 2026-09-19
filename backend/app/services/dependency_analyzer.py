from pathlib import PurePosixPath

from app.schemas import ASTAnalysis, DependencyAnalysis


class DependencyAnalyzer:
    def analyze(
        self, ast_analysis: list[ASTAnalysis]
    ) -> list[DependencyAnalysis]:
        module_paths = self._module_paths(ast_analysis)
        dependencies: list[DependencyAnalysis] = []
        seen: set[tuple[str, str]] = set()

        for analysis in ast_analysis:
            for imported_module in analysis.imports:
                target_module = self._resolve_import(
                    imported_module,
                    analysis.path,
                    module_paths,
                )
                if target_module is None:
                    continue

                dependency = (analysis.path, target_module)
                if dependency in seen:
                    continue
                seen.add(dependency)
                dependencies.append(
                    DependencyAnalysis(
                        source_file=analysis.path,
                        target_module=target_module,
                    )
                )

        return dependencies

    @staticmethod
    def _module_paths(ast_analysis: list[ASTAnalysis]) -> dict[str, list[str]]:
        module_paths: dict[str, list[str]] = {}
        for analysis in ast_analysis:
            if analysis.language != "python":
                continue

            for module in DependencyAnalyzer._module_names(analysis.path):
                module_paths.setdefault(module, []).append(analysis.path)
        return module_paths

    @staticmethod
    def _module_names(path: str) -> list[str]:
        path_parts = PurePosixPath(path).parts
        if not path_parts:
            return []

        module_parts = list(PurePosixPath(path).with_suffix("").parts)
        if module_parts[-1] == "__init__":
            module_parts.pop()

        return [
            ".".join(module_parts[index:])
            for index in range(len(module_parts))
            if module_parts[index:]
        ]

    @classmethod
    def _resolve_import(
        cls,
        imported_module: str,
        source_path: str,
        module_paths: dict[str, list[str]],
    ) -> str | None:
        candidates = cls._import_candidates(imported_module, source_path)
        for candidate in candidates:
            paths = module_paths.get(candidate, [])
            if len(paths) == 1:
                return candidate
            if len(paths) > 1:
                return None
        return None

    @staticmethod
    def _import_candidates(imported_module: str, source_path: str) -> list[str]:
        if not imported_module.startswith("."):
            module_parts = imported_module.split(".")
            return [
                ".".join(module_parts[:index])
                for index in range(len(module_parts), 0, -1)
            ]

        source_parts = PurePosixPath(source_path).with_suffix("").parts
        if source_parts and source_parts[-1] == "__init__":
            package_parts = source_parts[:-1]
        else:
            package_parts = source_parts[:-1]

        level = len(imported_module) - len(imported_module.lstrip("."))
        base_parts = package_parts[: max(0, len(package_parts) - level + 1)]
        relative_module = imported_module[level:]
        if relative_module:
            base_parts += tuple(relative_module.split("."))

        return [
            ".".join(base_parts[:index])
            for index in range(len(base_parts), 0, -1)
        ]