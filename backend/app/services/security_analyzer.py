import re

from app.schemas import SecurityAnalysis, SecurityFinding, SourceFile


SECRET_NAMES = re.compile(
    r"\b(?:api[_-]?key|secret[_-]?key|password|token)\b\s*[:=]\s*['\"]([^'\"]+)['\"]",
    re.IGNORECASE,
)
PLACEHOLDER_VALUES = {"example", "test", "testing", "changeme", "your_api_key", "your-secret", "placeholder"}
SUPPORTED_LANGUAGES = {"python", "javascript", "typescript"}


class SecurityAnalyzer:
    rules = (
        "hardcoded_secret", "eval", "exec", "shell_true", "pickle",
        "weak_crypto", "sql_concat", "http_url", "permissive_cors",
        "debug_true", "unsafe_file", "new_function", "dangerous_dom",
        "child_process_shell",
    )

    def analyze(self, source_files: list[SourceFile]) -> SecurityAnalysis:
        findings: list[SecurityFinding] = []
        triggered: set[str] = set()
        skipped: dict[str, int] = {}
        seen: set[tuple[str, int, str]] = set()
        finding_number = 0

        def add(source_file: SourceFile, line_number: int, rule: str, severity: str, category: str, title: str, line: str, description: str, recommendation: str, confidence: str = "high") -> None:
            nonlocal finding_number
            finding_key = (source_file.path, line_number, rule)
            if finding_key in seen:
                return
            seen.add(finding_key)
            finding_number += 1
            findings.append(SecurityFinding(
                id=f"security-{finding_number}", rule=rule, severity=severity,
                category=category, title=title, file=source_file.path,
                line=line_number, evidence=line.strip(), description=description,
                recommendation=recommendation, confidence=confidence,
            ))
            triggered.add(rule)

        for source_file in source_files:
            if source_file.language not in SUPPORTED_LANGUAGES:
                skipped[source_file.language] = skipped.get(source_file.language, 0) + 1
                continue
            is_web = source_file.language in {"javascript", "typescript"}
            for line_number, line in enumerate(source_file.content.splitlines(), 1):
                if match := SECRET_NAMES.search(line):
                    if match.group(1).lower() not in PLACEHOLDER_VALUES and len(match.group(1)) >= 8:
                        add(source_file, line_number, "hardcoded_secret", "high", "Hardcoded Secret", "Potential hardcoded secret", line, "A credential-like assignment contains a non-placeholder literal.", "Move secrets to environment or secret management and rotate exposed credentials.")
                if re.search(r"\beval\s*\(", line):
                    add(source_file, line_number, "eval", "high", "Code Injection", "Dynamic eval execution", line, "eval executes dynamically supplied code.", "Avoid eval and use a constrained parser or explicit dispatch.")
                if re.search(r"\bexec\s*\(", line) and not is_web:
                    add(source_file, line_number, "exec", "high", "Code Injection", "Dynamic exec execution", line, "exec executes dynamically supplied code.", "Avoid exec and use explicit, validated operations.")
                if re.search(r"subprocess\.[A-Za-z_]+\s*\(.*shell\s*=\s*True", line):
                    add(source_file, line_number, "shell_true", "high", "Command Injection", "Shell command execution", line, "A subprocess call enables shell interpretation.", "Avoid shell=True and pass arguments as a list.")
                if re.search(r"\b(?:pickle\.(?:load|loads)|yaml\.load)\s*\(", line):
                    add(source_file, line_number, "pickle", "high", "Unsafe Deserialization", "Unsafe deserialization", line, "An unsafe deserializer can execute code while loading untrusted data.", "Use a safe data format and validate untrusted input.")
                if re.search(r"\b(?:md5|sha1)\s*\(", line, re.IGNORECASE) or "createHash('md5')" in line or 'createHash("md5")' in line:
                    add(source_file, line_number, "weak_crypto", "medium", "Cryptography", "Weak cryptographic primitive", line, "A deprecated or collision-prone hash is used.", "Use a modern authenticated hash or password hashing algorithm.")
                if re.search(r"(?:SELECT|INSERT|UPDATE|DELETE).*\+|\+.*(?:SELECT|INSERT|UPDATE|DELETE)", line, re.IGNORECASE):
                    add(source_file, line_number, "sql_concat", "high", "Injection", "SQL query string construction", line, "SQL appears to be constructed by string concatenation.", "Use parameterized queries and bound values.")
                if "http://" in line and "http://localhost" not in line and "http://127.0.0.1" not in line:
                    add(source_file, line_number, "http_url", "low", "Transport Security", "HTTP URL in source", line, "An external URL uses unencrypted HTTP.", "Use HTTPS for external network communication.", "medium")
                if re.search(r"\bDEBUG\s*=\s*True\b", line):
                    add(source_file, line_number, "debug_true", "medium", "Configuration", "Debug mode enabled", line, "Debug mode can expose diagnostic information in production.", "Disable debug mode in production configuration.")
                if re.search(r"(?:chmod\s*\([^)]*0?777|open\s*\([^)]*,\s*['\"]w)", line):
                    add(source_file, line_number, "unsafe_file", "medium", "File Safety", "Potentially unsafe file operation", line, "The file operation may permit broad access or overwrite data without validation.", "Validate paths and use least-privilege permissions.", "medium")
                if is_web and re.search(r"new\s+Function\s*\(", line):
                    add(source_file, line_number, "new_function", "high", "Code Injection", "Dynamic Function construction", line, "new Function evaluates dynamically supplied code.", "Avoid dynamic function construction.")
                if is_web and re.search(r"(?:innerHTML|outerHTML|insertAdjacentHTML)\s*=", line):
                    add(source_file, line_number, "dangerous_dom", "high", "Cross-Site Scripting", "Dangerous DOM assignment", line, "Untrusted HTML assignment can enable script injection.", "Use textContent or sanitize trusted HTML before insertion.")
                if is_web and re.search(r"child_process\.(?:exec|execSync|spawn)\s*\(", line):
                    add(source_file, line_number, "child_process_shell", "high", "Command Injection", "Child process execution", line, "A child process API can execute attacker-controlled commands.", "Validate arguments and avoid shell interpretation.")
                if is_web and re.search(r"(?:cors|Access-Control-Allow-Origin).*[*'\"]", line, re.IGNORECASE):
                    add(source_file, line_number, "permissive_cors", "medium", "Access Control", "Permissive CORS policy", line, "A wildcard origin may allow unintended cross-origin access.", "Restrict allowed origins to trusted applications.", "medium")

        counts = {severity: sum(finding.severity == severity for finding in findings) for severity in ("critical", "high", "medium", "low")}
        files_skipped = sum(skipped.values())
        files_scanned = len(source_files) - files_skipped
        return SecurityAnalysis(
            status="completed" if files_scanned else "no_eligible_files",
            summary="Static analysis",
            findings=findings,
            total_findings=len(findings),
            critical_count=counts["critical"], high_count=counts["high"],
            medium_count=counts["medium"], low_count=counts["low"],
            files_scanned=files_scanned, rules_applied=list(self.rules),
            rules_triggered=sorted(triggered), files_skipped=files_skipped,
            skipped_reasons=skipped,
        )
