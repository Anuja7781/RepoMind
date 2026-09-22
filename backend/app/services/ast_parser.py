import ast

from app.schemas import (
    ASTAnalysis,
    BaseReference,
    CallReference,
    ClassAnalysis,
    FunctionAnalysis,
    ImportBinding,
    SourceFile,
)


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
        import_bindings = [
            binding
            for node in ast.walk(tree)
            if isinstance(node, (ast.Import, ast.ImportFrom))
            for binding in self._import_bindings(node)
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
            import_bindings=import_bindings,
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
            call_references=cls._call_references(node),
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
            base_references=[
                BaseReference(
                    expression=expression,
                    line_number=node.lineno,
                )
                for expression in (cls._expression_name(base) for base in node.bases)
                if expression is not None
            ],
        )

    @classmethod
    def _call_references(
        cls,
        node: ast.FunctionDef | ast.AsyncFunctionDef,
    ) -> list[CallReference]:
        references: list[CallReference] = []

        class CallVisitor(ast.NodeVisitor):
            def visit_Call(self, call_node: ast.Call) -> None:
                expression = cls._expression_name(call_node.func)
                if expression is not None:
                    references.append(
                        CallReference(
                            expression=expression,
                            line_number=call_node.lineno,
                        )
                    )
                self.generic_visit(call_node)

            def visit_FunctionDef(self, nested_node: ast.FunctionDef) -> None:
                if nested_node is not node:
                    return
                self.generic_visit(nested_node)

            def visit_AsyncFunctionDef(
                self,
                nested_node: ast.AsyncFunctionDef,
            ) -> None:
                if nested_node is not node:
                    return
                self.generic_visit(nested_node)

            def visit_ClassDef(self, nested_node: ast.ClassDef) -> None:
                return

        visitor = CallVisitor()
        for statement in node.body:
            visitor.visit(statement)
        return references

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

    @staticmethod
    def _import_bindings(node: ast.Import | ast.ImportFrom) -> list[ImportBinding]:
        if isinstance(node, ast.Import):
            return [
                ImportBinding(
                    local_name=alias.asname or alias.name.split(".", 1)[0],
                    qualified_name=alias.name if alias.asname else alias.name.split(".", 1)[0],
                )
                for alias in node.names
            ]

        module = "." * node.level + (node.module or "")
        return [
            ImportBinding(
                local_name=alias.asname or alias.name,
                qualified_name=f"{module}.{alias.name}" if module else alias.name,
            )
            for alias in node.names
        ]

    @staticmethod
    def _expression_name(node: ast.AST) -> str | None:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            parent = ASTParser._expression_name(node.value)
            return f"{parent}.{node.attr}" if parent else None
        return None