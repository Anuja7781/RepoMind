import ast
from collections import Counter
from pathlib import PurePosixPath

from app.schemas import (
    ASTAnalysis,
    BugRiskFactor,
    BugRiskFinding,
    BugRiskSummary,
    DependencyAnalysis,
    EntityGraph,
    SecurityAnalysis,
    SourceFile,
)


class BugRiskAnalyzer:
    """Calculate deterministic, repository-evidence-based predicted bug risk."""

    def analyze(
        self,
        source_files: list[SourceFile],
        ast_analysis: list[ASTAnalysis],
        dependency_analysis: list[DependencyAnalysis],
        entity_graph: EntityGraph,
        security_analysis: SecurityAnalysis,
    ) -> BugRiskSummary:
        ast_by_path = {item.path: item for item in ast_analysis}
        outgoing = Counter(item.source_file for item in dependency_analysis)
        incoming = Counter(
            target_path
            for item in dependency_analysis
            for target_path in self._module_paths(ast_analysis).get(item.target_module, [])
        )
        security_by_file = Counter(item.file for item in security_analysis.findings)
        entity_relationships = self._entity_relationship_counts(entity_graph)

        findings = [
            self._finding(
                source_file,
                ast_by_path.get(source_file.path),
                outgoing[source_file.path],
                incoming[source_file.path],
                entity_relationships.get(source_file.path, 0),
                security_by_file[source_file.path],
            )
            for source_file in source_files
        ]
        findings.sort(key=lambda finding: (-finding.score, finding.path))
        counts = Counter(finding.level for finding in findings)
        return BugRiskSummary(
            status="completed" if source_files else "no_eligible_files",
            total_files_analyzed=len(findings),
            files_analyzed=len(findings),
            signals_used=[
                "source size", "line count", "function/class/method counts",
                "AST complexity when available", "imports", "dependencies",
                "dependents", "entity relationships", "function density",
                "TODO/FIXME markers", "documentation coverage", "security findings",
            ],
            high_risk_count=counts["high"],
            medium_risk_count=counts["medium"],
            low_risk_count=counts["low"],
            critical_count=counts["critical"],
            findings=findings,
        )

    def _finding(
        self,
        source_file: SourceFile,
        ast_item: ASTAnalysis | None,
        dependency_count: int,
        dependent_count: int,
        entity_relationship_count: int,
        security_finding_count: int,
    ) -> BugRiskFinding:
        lines = source_file.content.splitlines()
        line_count = len(lines)
        byte_count = len(source_file.content.encode("utf-8"))
        function_count = len(ast_item.functions) if ast_item else 0
        class_count = len(ast_item.classes) if ast_item else 0
        method_count = sum(len(item.methods) for item in ast_item.class_details) if ast_item else 0
        import_count = len(ast_item.imports) if ast_item else 0
        complexity = self._cyclomatic_complexity(source_file.content) if ast_item else None
        documentation_coverage = self._documentation_coverage(source_file.content, ast_item)
        todo_count = source_file.content.lower().count("todo")
        fixme_count = source_file.content.lower().count("fixme")
        function_density = round(function_count / line_count * 100, 2) if line_count else 0
        coupling = dependency_count + dependent_count + entity_relationship_count

        factors: list[BugRiskFactor] = [
            self._complexity_signal(line_count, function_count, class_count, complexity),
            self._coupling_signal(coupling, dependency_count, dependent_count, entity_relationship_count),
            self._security_signal(security_finding_count),
            self._maintainability_signal(byte_count, function_density, todo_count, fixme_count),
        ]
        documentation_signal = self._documentation_signal(documentation_coverage, todo_count, fixme_count)
        if documentation_signal is not None:
            factors.append(documentation_signal)

        score = max(0, min(100, sum(factor.contribution for factor in factors)))
        level = self._risk_level(score)
        contributing_factors = [self._factor_label(factor) for factor in factors if factor.contribution >= 5]
        evidence = {
            "line_count": line_count,
            "source_bytes": byte_count,
            "function_count": function_count,
            "class_count": class_count,
            "method_count": method_count,
            "import_count": import_count,
            "dependency_count": dependency_count,
            "dependent_count": dependent_count,
            "entity_relationship_count": entity_relationship_count,
            "function_density_percent": function_density,
            "todo_count": todo_count,
            "fixme_count": fixme_count,
            "documentation_coverage_percent": documentation_coverage,
            "security_finding_count": security_finding_count,
            "ast_complexity": complexity,
            "contributions": {factor.name: factor.contribution for factor in factors},
            "formula": "sum of available normalized complexity, coupling, documentation, security, and maintainability contributions",
        }
        available_signals = sum(factor.available for factor in factors)
        confidence = "high" if available_signals >= 5 else "medium" if available_signals >= 3 else "low"
        explanation = (
            f"Predicted bug risk is {score}/100 based on static repository evidence. "
            "This score does not prove that a defect exists. "
            f"Contributions: {', '.join(f'{factor.name} {factor.contribution}' for factor in factors)}."
        )
        return BugRiskFinding(
            path=source_file.path,
            score=score,
            level=level,
            factors=contributing_factors,
            explanation=explanation,
            confidence=confidence,
            evidence=evidence,
        )

    @staticmethod
    def _complexity_signal(lines: int, functions: int, classes: int, complexity: int | None) -> BugRiskFactor:
        terms = [min(lines / 200, 1) * 8, min(functions / 10, 1) * 8, min(classes / 5, 1) * 4]
        if complexity is not None:
            terms.append(min(complexity / 20, 1) * 10)
        return BugRiskFactor(
            name="complexity",
            contribution=round(sum(terms)),
            signal="source size, functions, classes, and AST complexity where available",
            value=complexity if complexity is not None else lines,
            available=complexity is not None or bool(lines),
        )

    @staticmethod
    def _coupling_signal(total: int, dependencies: int, dependents: int, relationships: int) -> BugRiskFactor:
        return BugRiskFactor(
            name="coupling",
            contribution=round(min(total / 12, 1) * 25),
            signal="dependencies + dependents + entity relationships",
            value={"dependencies": dependencies, "dependents": dependents, "entity_relationships": relationships},
            available=True,
        )

    @staticmethod
    def _documentation_signal(coverage: float | None, todos: int, fixmes: int) -> BugRiskFactor | None:
        if coverage is None and todos == 0 and fixmes == 0:
            return None
        contribution = round((100 - coverage) / 100 * 10 if coverage is not None else 0)
        contribution += min(todos * 2 + fixmes * 4, 5)
        return BugRiskFactor(
            name="documentation",
            contribution=min(contribution, 15),
            signal="documentation coverage and TODO/FIXME markers",
            value=coverage,
            available=coverage is not None or todos > 0 or fixmes > 0,
        )

    @staticmethod
    def _security_signal(findings: int) -> BugRiskFactor:
        return BugRiskFactor(
            name="security",
            contribution=min(findings * 8, 20),
            signal="security findings in this file",
            value=findings,
            available=True,
        )

    @staticmethod
    def _maintainability_signal(byte_count: int, density: float, todos: int, fixmes: int) -> BugRiskFactor:
        contribution = round(min(byte_count / 50_000, 1) * 4 + min(density / 10, 1) * 3 + min((todos + fixmes) / 5, 1) * 3)
        return BugRiskFactor(
            name="maintainability",
            contribution=contribution,
            signal="source size, function density, and unresolved markers",
            value={"source_bytes": byte_count, "function_density_percent": density},
            available=True,
        )

    @staticmethod
    def _documentation_coverage(content: str, ast_item: ASTAnalysis | None) -> float | None:
        if ast_item is None:
            return None
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return None
        documented = total = 0
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                total += 1
                documented += bool(ast.get_docstring(node))
        return round(documented / total * 100, 2) if total else 100.0

    @staticmethod
    def _cyclomatic_complexity(content: str) -> int | None:
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return None
        decision_nodes = (ast.If, ast.For, ast.AsyncFor, ast.While, ast.IfExp, ast.Try, ast.With, ast.AsyncWith, ast.comprehension)
        complexity = 1 + sum(isinstance(node, decision_nodes) for node in ast.walk(tree))
        complexity += sum(len(node.values) - 1 for node in ast.walk(tree) if isinstance(node, ast.BoolOp))
        return complexity

    @staticmethod
    def _module_paths(ast_analysis: list[ASTAnalysis]) -> dict[str, list[str]]:
        module_paths: dict[str, list[str]] = {}
        for item in ast_analysis:
            if item.language != "python":
                continue
            parts = list(PurePosixPath(item.path).with_suffix("").parts)
            if parts and parts[-1] == "__init__":
                parts.pop()
            for index in range(len(parts)):
                module = ".".join(parts[index:])
                module_paths.setdefault(module, []).append(item.path)
        return module_paths

    @staticmethod
    def _entity_relationship_counts(graph: EntityGraph) -> dict[str, int]:
        counts: Counter[str] = Counter()
        for edge in graph.edges:
            for endpoint in (edge.source, edge.target):
                if endpoint.startswith(("file:", "module:")):
                    path = endpoint.split(":", 1)[1]
                    if path.endswith(".py"):
                        counts[path] += 1
        return counts

    @staticmethod
    def _factor_label(factor: BugRiskFactor) -> str:
        labels = {"complexity": "High complexity or source size", "coupling": "High dependency coupling", "documentation": "Low documentation coverage or unresolved markers", "security": "Security finding in this file", "maintainability": "Maintainability pressure from file structure"}
        return labels[factor.name]

    @staticmethod
    def _risk_level(score: int) -> str:
        if score >= 80:
            return "critical"
        if score >= 60:
            return "high"
        if score >= 30:
            return "medium"
        return "low"