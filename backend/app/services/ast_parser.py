import ast

from app.schemas import ASTAnalysis, SourceFile


class ASTParser:
    def analyze_source_file(self, source_file: SourceFile) -> ASTAnalysis | None:
        if source_file.language != "python":
            return None

        try:
            tree = ast.parse(source_file.content, filename=source_file.path)
        except SyntaxError:
            return ASTAnalysis(path=source_file.path, language=source_file.language)

        imports = [
            imported_name
            for node in ast.walk(tree)
            if isinstance(node, (ast.Import, ast.ImportFrom))
            for imported_name in self._import_names(node)
        ]
        classes = [
            node.name for node in ast.walk(tree) if isinstance(node, ast.ClassDef)
        ]
        functions = [
            node.name
            for node in ast.walk(tree)
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]

        return ASTAnalysis(
            path=source_file.path,
            language=source_file.language,
            imports=imports,
            classes=classes,
            functions=functions,
        )

    @staticmethod
    def _import_names(node: ast.Import | ast.ImportFrom) -> list[str]:
        if isinstance(node, ast.Import):
            return [alias.name for alias in node.names]

        module = "." * node.level + (node.module or "")
        return [
            f"{module}.{alias.name}" if module else alias.name
            for alias in node.names
        ]