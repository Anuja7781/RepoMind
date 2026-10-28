import hashlib
import secrets
import threading
import time

from app.schemas import RepositoryAnalysis


class AnalysisTransferStoreFullError(Exception):
    """Raised when the temporary analysis transfer store is at capacity."""


class AnalysisTransferStore:
    def __init__(
        self,
        ttl_seconds: int = 600,
        max_entries: int = 8,
        clock=time.monotonic,
    ) -> None:
        self.ttl_seconds = ttl_seconds
        self.max_entries = max_entries
        self._clock = clock
        self._lock = threading.Lock()
        self._entries: dict[str, tuple[float, RepositoryAnalysis]] = {}

    @staticmethod
    def _key(result_id: str) -> str:
        return hashlib.sha256(result_id.encode("utf-8")).hexdigest()

    def _remove_expired(self, now: float) -> None:
        expired_keys = [
            key for key, (expires_at, _) in self._entries.items()
            if expires_at <= now
        ]
        for key in expired_keys:
            del self._entries[key]

    def store(self, analysis: RepositoryAnalysis) -> tuple[str, int]:
        now = self._clock()
        with self._lock:
            self._remove_expired(now)
            if len(self._entries) >= self.max_entries:
                raise AnalysisTransferStoreFullError

            result_id = secrets.token_urlsafe(32)
            self._entries[self._key(result_id)] = (
                now + self.ttl_seconds,
                analysis,
            )
        return result_id, self.ttl_seconds

    def retrieve(self, result_id: str) -> RepositoryAnalysis | None:
        now = self._clock()
        key = self._key(result_id)
        with self._lock:
            self._remove_expired(now)
            entry = self._entries.get(key)
            return entry[1] if entry else None

    def cleanup_expired(self) -> None:
        with self._lock:
            self._remove_expired(self._clock())
