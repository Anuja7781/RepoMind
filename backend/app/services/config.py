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