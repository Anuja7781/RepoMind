import os
from pathlib import Path

from dotenv import load_dotenv


class ConfigurationError(Exception):
    """Raised when required application configuration is missing."""


def get_github_token() -> str:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(env_path)

    token = os.getenv("GITHUB_TOKEN")
    if not token or not token.strip():
        raise ConfigurationError("GITHUB_TOKEN is not configured")
    return token.strip()


def get_ai_configuration_diagnostics() -> dict[str, str]:
    env_path = Path(__file__).resolve().parents[2] / ".env"
    load_dotenv(env_path)
    return {
        "GEMINI_API_KEY": "configured" if os.getenv("GEMINI_API_KEY", "").strip() else "missing",
        "GROQ_API_KEY": "configured" if os.getenv("GROQ_API_KEY", "").strip() else "missing",
        "OPENROUTER_API_KEY": "configured" if os.getenv("OPENROUTER_API_KEY", "").strip() else "missing",
        "GEMINI_MODEL": os.getenv("GEMINI_MODEL", "gemini-3.8-flash"),
        "GROQ_MODEL": os.getenv("GROQ_MODEL", "openai/gpt-oss-20b"),
        "OPENROUTER_MODEL": os.getenv("OPENROUTER_MODEL", "openrouter/free"),
    }