import ast

from app.schemas import ASTAnalysis, ClassAnalysis, FunctionAnalysis, SourceFile


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
        function_details = [
            self._function_details(node, source_file.path)
            for node in tree.body
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]
        class_details = [
            self._class_details(node, source_file.path)
            for node in tree.body
            if isinstance(node, ast.ClassDef)
        ]

        return ASTAnalysis(
            path=source_file.path,
            language=source_file.language,
            imports=imports,
            classes=classes,
            functions=functions,
            function_details=function_details,
            class_details=class_details,
        )

    @classmethod
    def _function_details(
        cls,
        node: ast.FunctionDef | ast.AsyncFunctionDef,
        path: str,
    ) -> FunctionAnalysis:
        return FunctionAnalysis(
            name=node.name,
            path=path,
            line_number=node.lineno,
            parameters=cls._parameters(node.args),
        )

    @classmethod
    def _class_details(cls, node: ast.ClassDef, path: str) -> ClassAnalysis:
        methods = [
            cls._function_details(method, path)
            for method in node.body
            if isinstance(method, (ast.FunctionDef, ast.AsyncFunctionDef))
        ]
        return ClassAnalysis(
            name=node.name,
            path=path,
            line_number=node.lineno,
            methods=methods,
        )

    @staticmethod
    def _parameters(arguments: ast.arguments) -> list[str]:
        parameters = [argument.arg for argument in arguments.posonlyargs]
        parameters.extend(argument.arg for argument in arguments.args)
        if arguments.vararg is not None:
            parameters.append(arguments.vararg.arg)
        parameters.extend(argument.arg for argument in arguments.kwonlyargs)
        if arguments.kwarg is not None:
            parameters.append(arguments.kwarg.arg)
        return parameters

    @staticmethod
    def _import_names(node: ast.Import | ast.ImportFrom) -> list[str]:
        if isinstance(node, ast.Import):
            return [alias.name for alias in node.names]

        module = "." * node.level + (node.module or "")
        return [
            f"{module}.{alias.name}" if module else alias.name
            for alias in node.names
        ]