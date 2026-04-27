"""
Groq LLM client with structured JSON output.

Uses Groq's API (compatible with OpenAI SDK pattern) for fast inference
with Llama 3.3 70B. Falls back gracefully if the API is unavailable.
"""

import json
import logging

from groq import APIConnectionError, APIError, Groq
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from config import settings

logger = logging.getLogger(__name__)

_client: Groq | None = None


def get_groq_client() -> Groq | None:
    """Get or create the Groq client singleton."""
    global _client
    if _client is None and settings.groq_api_key:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((APIError, APIConnectionError)),
    reraise=True,
)
def chat_completion(
    system_prompt: str,
    user_message: str,
    *,
    temperature: float = 0.1,
    max_tokens: int = 1024,
    response_format: dict | None = None,
) -> str:
    """
    Send a chat completion request to Groq.

    Returns the raw response text. Caller is responsible for parsing.
    Raises if Groq is unavailable after retries.
    """
    client = get_groq_client()
    if client is None:
        raise RuntimeError("Groq API key not configured")

    kwargs: dict = {
        "model": settings.groq_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if response_format:
        kwargs["response_format"] = response_format

    response = client.chat.completions.create(**kwargs)
    content = response.choices[0].message.content or ""
    return content.strip()


def chat_completion_json(
    system_prompt: str,
    user_message: str,
    *,
    temperature: float = 0.1,
    max_tokens: int = 1024,
) -> dict:
    """
    Chat completion with JSON output mode. Parses the response into a dict.
    """
    raw = chat_completion(
        system_prompt,
        user_message,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        logger.error("Failed to parse Groq JSON response: %s", raw[:200])
        # Try to extract JSON from the response
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(raw[start:end])
        raise ValueError(f"Could not parse JSON from Groq response: {raw[:200]}")
