from app.schemas import SourceFile
from app.services.security_analyzer import SecurityAnalyzer


def test_python_rules_report_evidence_backed_findings_once_per_rule_line():
    source = SourceFile(
        path="unsafe.py",
        language="python",
        content=(
            "eval(user_input)\n"
            "exec(user_input)\n"
            "subprocess.run(command, shell=True)\n"
            "password = 'secret-value'\n"
            "pickle.loads(data)\n"
            "DEBUG = True\n"
            "hashlib.md5(value)\n"
            "query = 'SELECT * FROM users WHERE id=' + user_id\n"
            "requests.get('http://example.com')\n"
        ),
    )

    result = SecurityAnalyzer().analyze([source])
    rules = {finding.rule for finding in result.findings}

    assert {"eval", "exec", "shell_true", "hardcoded_secret", "pickle", "debug_true", "weak_crypto", "sql_concat", "http_url"} <= rules
    assert all(finding.file == "unsafe.py" and finding.line and finding.evidence for finding in result.findings)
    assert len({(finding.file, finding.line, finding.rule) for finding in result.findings}) == len(result.findings)
    assert result.files_scanned == 1
    assert result.status == "completed"


def test_javascript_rules_and_unsupported_files_are_traced():
    javascript = SourceFile(
        path="unsafe.ts",
        language="typescript",
        content=(
            "eval(input)\n"
            "const fn = new Function(code)\n"
            "element.innerHTML = value\n"
            "child_process.exec(command)\n"
            "fetch('http://example.com')\n"
            "const cors = '*';\n"
        ),
    )
    stylesheet = SourceFile(path="styles.css", language="css", content="body {}\n")

    result = SecurityAnalyzer().analyze([javascript, stylesheet])
    rules = {finding.rule for finding in result.findings}

    assert {"eval", "new_function", "dangerous_dom", "child_process_shell", "http_url", "permissive_cors"} <= rules
    assert result.files_scanned == 1
    assert result.files_skipped == 1
    assert result.skipped_reasons == {"css": 1}


def test_safe_source_has_no_findings():
    result = SecurityAnalyzer().analyze([
        SourceFile(path="safe.py", language="python", content="def add(left, right):\n    return left + right\n")
    ])

    assert result.status == "completed"
    assert result.total_findings == 0
    assert result.findings == []