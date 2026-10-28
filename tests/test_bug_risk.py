from app.schemas import (
    ASTAnalysis,
    DependencyAnalysis,
    EntityGraph,
    SecurityAnalysis,
    SecurityFinding,
    SourceFile,
)
from app.services.ast_parser import ASTParser
from app.services.bug_risk_analyzer import BugRiskAnalyzer


def analyze(source_files, dependencies=None, security=None):
    return BugRiskAnalyzer().analyze(
        source_files,
        [parsed for source in source_files if (parsed := ASTParser().analyze_source_file(source))],
        dependencies or [],
        EntityGraph(),
        security or SecurityAnalysis(files_scanned=len(source_files)),
    )


def test_empty_repository_analysis():
    result = analyze([])

    assert result.total_files_analyzed == 0
    assert result.findings == []


def test_low_risk_file_uses_actual_path_and_is_bounded():
    result = analyze([SourceFile(path="src/quiet.py", language="python", content="value = 1\n")])

    assert result.findings[0].path == "src/quiet.py"
    assert result.findings[0].level == "low"
    assert 0 <= result.findings[0].score <= 100


def test_high_risk_file_uses_complexity_and_coupling():
    content = "\n".join(
        line
        for index in range(12)
        for line in (f"def function_{index}(value):", "    if value:", "        return value")
    )
    content += "\n" + "\n".join("# actual source evidence" for _ in range(1000))
    content += "\n" + "\n".join(f"class Class_{index}:\n    pass" for index in range(5))
    source = SourceFile(path="actual/risky.py", language="python", content=content)
    dependencies = [
        DependencyAnalysis(source_file="actual/risky.py", target_module=f"pkg.module_{index}")
        for index in range(12)
    ]

    finding = analyze([source], dependencies).findings[0]

    assert finding.path == "actual/risky.py"
    assert finding.level in {"high", "critical"}
    assert finding.evidence["dependency_count"] == 12
    assert "High dependency coupling" in finding.factors


def test_security_finding_increases_bug_risk_without_becoming_a_bug_finding():
    source = SourceFile(path="src/auth.py", language="python", content="token = 'abcdefghijk'\n")
    security = SecurityAnalysis(
        findings=[SecurityFinding(
            id="security-1", rule="hardcoded_secret", severity="high", category="secret", title="Secret", file="src/auth.py",
            evidence="token = 'abcdefghijk'", description="secret", recommendation="rotate", confidence="high",
        )],
        total_findings=1,
        high_count=1,
        files_scanned=1,
    )

    finding = analyze([source], security=security).findings[0]

    assert finding.evidence["security_finding_count"] == 1
    assert finding.evidence["contributions"]["security"] == 8
    assert "Security finding in this file" in finding.factors


def test_missing_ast_data_is_explicit_and_does_not_invent_complexity():
    source = SourceFile(path="src/client.ts", language="typescript", content="export const value = 1;\n")

    finding = analyze([source]).findings[0]

    assert finding.evidence["ast_complexity"] is None
    assert finding.evidence["documentation_coverage_percent"] is None
    assert "unavailable" not in finding.explanation


def test_score_is_deterministic_and_between_zero_and_one_hundred():
    source = SourceFile(path="src/repeat.py", language="python", content="def repeat(value):\n    return value\n")

    first = analyze([source]).findings[0]
    second = analyze([source]).findings[0]

    assert first.score == second.score
    assert first.evidence == second.evidence
    assert 0 <= first.score <= 100