from pathlib import PurePosixPath

from app.schemas import (
    ArchitectureAnalysis,
    ArchitectureComponent,
    ASTAnalysis,
    DependencyAnalysis,
)


DIRECTORY_COMPONENT_TYPES = {
    "routes": "Routes",
    "models": "Models",
    "services": "Services",
    "config": "Configuration",
    "utils": "Utilities",
    "utlis": "Utilities",
}
CONFIGURATION_FILES = {"config.py", "configuration.py", "settings.py"}
APPLICATION_FILES = {"app.py", "main.py"}
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
    ) -> ArchitectureAnalysis:
        component_files: dict[str, list[str]] = {}

        for analysis in ast_analysis:
            path = PurePosixPath(analysis.path)
            path_parts = path.parts
            if any(part.lower() in EXCLUDED_PATH_PARTS for part in path_parts):
                continue

            file_name = path_parts[-1].lower()
            if file_name in CONFIGURATION_FILES:
                self._add_file(component_files, "config", analysis.path)
            if file_name in APPLICATION_FILES:
                self._add_file(component_files, "application", analysis.path)

            for folder in path_parts[:-1]:
                folder = folder.lower()
                if folder in DIRECTORY_COMPONENT_TYPES:
                    self._add_file(component_files, folder, analysis.path)

        components = [
            ArchitectureComponent(
                name=folder,
                component_type=self._component_type(folder),
                files=files,
            )
            for folder, files in component_files.items()
        ]
        return ArchitectureAnalysis(
            components=components,
            relationships=dependencies,
        )

    @staticmethod
    def _add_file(
        component_files: dict[str, list[str]], component: str, path: str
    ) -> None:
        component_files.setdefault(component, []).append(path)

    @staticmethod
    def _component_type(component: str) -> str:
        if component == "application":
            return "Application"
        return DIRECTORY_COMPONENT_TYPES[component]