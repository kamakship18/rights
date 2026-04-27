"""
Indian Kanoon API client with retries and exponential backoff.

Used to fetch canonical statute text and case law citations.
Degrades gracefully when the API is unavailable or no key is configured.
"""

import logging

import httpx

from config import settings

logger = logging.getLogger(__name__)


class KanoonClient:
    """Client for the Indian Kanoon API."""

    def __init__(self):
        self.base_url = settings.kanoon_base_url
        self.api_key = settings.kanoon_api_key
        self._client: httpx.AsyncClient | None = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            headers = {}
            if self.api_key:
                headers["Authorization"] = f"Token {self.api_key}"
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=15.0,
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def search(self, query: str, *, page_num: int = 0) -> dict:
        """
        Search Indian Kanoon for statutes/case law.

        Returns parsed JSON response or empty result on failure.
        """
        if not self.api_key:
            logger.info("Indian Kanoon API key not configured, using fallback citations")
            return self._fallback_search(query)

        try:
            client = await self._get_client()
            response = await client.post(
                "/search/",
                data={"formInput": query, "pagenum": page_num},
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            logger.warning("Indian Kanoon API error %s: %s", e.response.status_code, e)
            return self._fallback_search(query)
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            logger.warning("Indian Kanoon API unavailable: %s", e)
            return self._fallback_search(query)
        except Exception as e:
            logger.error("Unexpected error querying Indian Kanoon: %s", e)
            return self._fallback_search(query)

    async def get_document(self, doc_id: str) -> dict:
        """
        Fetch a specific document by ID from Indian Kanoon.
        """
        if not self.api_key:
            return {"title": "", "text": "", "url": f"https://indiankanoon.org/doc/{doc_id}/"}

        try:
            client = await self._get_client()
            response = await client.post(f"/doc/{doc_id}/")
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.warning("Failed to fetch Kanoon doc %s: %s", doc_id, e)
            return {"title": "", "text": "", "url": f"https://indiankanoon.org/doc/{doc_id}/"}

    def _fallback_search(self, query: str) -> dict:
        """
        Return a fallback result when the API is unavailable.
        Uses well-known Indian Kanoon URLs for common statutes.
        """
        # Map common statute keywords to known Indian Kanoon URLs
        statute_urls = {
            "noise": {
                "title": "Noise Pollution (Regulation and Control) Rules, 2000",
                "url": "https://indiankanoon.org/doc/1489134/",
                "snippet": "Rule 5 — Restrictions on the use of loudspeakers/public address systems and sound producing instruments.",
            },
            "ipc": {
                "title": "Indian Penal Code",
                "url": "https://indiankanoon.org/doc/1569253/",
                "snippet": "The Indian Penal Code provides for criminal offences and their punishments.",
            },
            "stalking": {
                "title": "Section 354D IPC — Stalking",
                "url": "https://indiankanoon.org/doc/105655853/",
                "snippet": "Any man who follows a woman and contacts her despite clear disinterest, or monitors her activities.",
            },
            "harassment": {
                "title": "Section 354A IPC — Sexual Harassment",
                "url": "https://indiankanoon.org/doc/73105328/",
                "snippet": "Physical contact and advances involving unwelcome and explicit sexual overtures.",
            },
            "electricity": {
                "title": "Electricity (Rights of Consumers) Rules, 2020",
                "url": "https://indiankanoon.org/doc/194983612/",
                "snippet": "Rule 5 — Metering. Every consumer shall be provided with a correct meter.",
            },
        }

        query_lower = query.lower()
        results = []
        for key, info in statute_urls.items():
            if key in query_lower:
                results.append(info)

        return {
            "docs": results,
            "found": len(results),
            "source": "fallback",
        }


# Singleton instance
kanoon_client = KanoonClient()
