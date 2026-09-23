import re

from app.schemas import SecurityAnalysis, SecurityFinding, SourceFile


SECRET_NAMES = re.compile(r"\b(?:api[_-]?key|secret[_-]?key|password|token)\b\s*=\s*['\"]([^'\"]+)['\"]", re.IGNORECASE)
PLACEHOLDER_VALUES = {"example", "test", "testing", "changeme", "your_api_key", "your-secret", "placeholder"}


class SecurityAnalyzer:
    def analyze(self, source_files: list[SourceFile]) -> SecurityAnalysis:
        findings: list[SecurityFinding] = []
        triggered: set[str] = set()
        finding_number = 0

        def add(file: str, line: int, rule: str, severity: str, category: str, title: str, evidence: str, description: str, recommendation: str, confidence: str = "high") -> None:
            nonlocal finding_number
            finding_number += 1
            findings.append(SecurityFinding(id=f"security-{finding_number}", severity=severity, category=category, title=title, file=file, line=line, evidence=evidence.strip(), description=description, recommendation=recommendation, confidence=confidence))
            triggered.add(rule)

        for source_file in source_files:
            lines = source_file.content.splitlines()
            for line_number, line in enumerate(lines, 1):
                if match := SECRET_NAMES.search(line):
                    if match.group(1).lower() not in PLACEHOLDER_VALUES and len(match.group(1)) >= 8:
                        add(source_file.path, line_number, "hardcoded_secret", "high", "Hardcoded Secret", "Potential hardcoded secret", line, "A credential-like assignment contains a non-placeholder literal.", "Move secrets to environment or secret management and rotate exposed credentials.")
                if re.search(r"\beval\s*\(", line):
                    add(source_file.path, line_number, "eval", "high", "Code Injection", "Dynamic eval execution", line, "eval executes dynamically supplied code.", "Avoid eval and use a constrained parser or explicit dispatch.")
                if re.search(r"\bexec\s*\(", line):
                    add(source_file.path, line_number, "exec", "high", "Code Injection", "Dynamic exec execution", line, "exec executes dynamically supplied code.", "Avoid exec and use explicit, validated operations.")
                if re.search(r"subprocess\.[A-Za-z_]+\s*\(.*shell\s*=\s*True", line):
                    add(source_file.path, line_number, "shell_true", "high", "Command Injection", "Shell command execution", line, "A subprocess call enables shell interpretation.", "Avoid shell=True and pass arguments as a list.")
                if re.search(r"\bpickle\.(?:load|loads)\s*\(", line):
                    add(source_file.path, line_number, "pickle", "high", "Unsafe Deserialization", "Unsafe pickle deserialization", line, "Pickle can execute code while loading untrusted data.", "Use a safe data format and validate untrusted input.")
                if re.search(r"\bDEBUG\s*=\s*True\b", line):
                    add(source_file.path, line_number, "debug_true", "medium", "Configuration", "Debug mode enabled", line, "Debug mode can expose diagnostic information in production.", "Disable debug mode in production configuration.")
                if re.search(r"https?://", line) and "http://localhost" not in line and "http://127.0.0.1" not in line:
                    if "http://" in line:
                        add(source_file.path, line_number, "http_url", "low", "Transport Security", "HTTP URL in source", line, "An external URL uses unencrypted HTTP.", "Use HTTPS for external network communication.", "medium")

        counts = {severity: sum(finding.severity == severity for finding in findings) for severity in ("critical", "high", "medium", "low")}
        return SecurityAnalysis(summary="Static analysis", findings=findings, total_findings=len(findings), critical_count=counts["critical"], high_count=counts["high"], medium_count=counts["medium"], low_count=counts["low"], files_scanned=len(source_files), rules_triggered=sorted(triggered))