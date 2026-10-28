import ast
import re

from app.schemas import DocumentationAnalysis, DocumentationSection, ReadmeAnalysis, RepositoryAnalysis


class DocumentationAnalyzer:
    def analyze(self, analysis: RepositoryAnalysis) -> DocumentationAnalysis:
        readme_item = next((item for item in analysis.structure if item.path.lower() in {"readme", "readme.md", "readme.rst"}), None)
        functions = classes = methods = documented_functions = documented_classes = documented_methods = 0
        todo_count = fixme_count = comment_lines = 0
        for source_file in analysis.source_files:
            todo_count += len(re.findall(r"\bTODO\b", source_file.content, re.IGNORECASE))
            fixme_count += len(re.findall(r"\bFIXME\b", source_file.content, re.IGNORECASE))
            comment_lines += sum(1 for line in source_file.content.splitlines() if line.strip().startswith(("#", "//", "/*", "*")))
            if source_file.language != "python":
                continue
            try:
                tree = ast.parse(source_file.content)
            except SyntaxError:
                continue
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    functions += 1
                    if ast.get_docstring(node): documented_functions += 1
                elif isinstance(node, ast.ClassDef):
                    classes += 1
                    if ast.get_docstring(node): documented_classes += 1
                    for child in node.body:
                        if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                            methods += 1
                            if ast.get_docstring(child): documented_methods += 1

        def section(total: int, documented: int) -> DocumentationSection:
            return DocumentationSection(total=total, documented=documented, coverage=round(documented / total * 100, 2) if total else None)

        return DocumentationAnalysis(
            source_files=len(analysis.source_files),
            ast_files=len(analysis.ast_analysis),
            ast_coverage_percent=round(len(analysis.ast_analysis) / len(analysis.source_files) * 100, 2) if analysis.source_files else None,
            readme=ReadmeAnalysis(exists=readme_item is not None),
            documentation_files=sum(1 for item in analysis.structure if item.type == "blob" and (item.path.lower().endswith((".md", ".rst")) or "/docs/" in f"/{item.path.lower()}/")),
            functions=section(functions, documented_functions), classes=section(classes, documented_classes), methods=section(methods, documented_methods),
            todo_count=todo_count, fixme_count=fixme_count, source_comment_lines=comment_lines,
        )