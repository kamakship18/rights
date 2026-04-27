"""
Unit tests for the triage endpoint.

Tests three fixture scenarios:
1. Harassment (CRITICAL)
2. Noise complaint (HIGH)
3. Electricity dispute (NORMAL)
"""

from unittest.mock import patch

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ─── Mock Groq responses for deterministic testing ──────


def mock_triage_response(system_prompt: str, user_message: str, **kwargs) -> dict:
    """Mock the Groq LLM to return deterministic triage results."""
    text = user_message.lower()

    if "followed" in text or "harass" in text or "stalk" in text:
        return {
            "urgency": "CRITICAL",
            "category": "harassment",
            "confidence": 0.95,
            "reasoning": "Physical safety threat — stalking/harassment pattern detected.",
        }
    elif "noise" in text or "shor" in text or "dj" in text or "loud" in text:
        return {
            "urgency": "HIGH",
            "category": "noise",
            "confidence": 0.92,
            "reasoning": "Noise pollution complaint violating Noise Rules 2000.",
        }
    elif "electric" in text or "bill" in text or "meter" in text:
        return {
            "urgency": "NORMAL",
            "category": "electricity",
            "confidence": 0.88,
            "reasoning": "Electricity billing dispute — suspected faulty meter.",
        }
    else:
        return {
            "urgency": "NORMAL",
            "category": "other",
            "confidence": 0.5,
            "reasoning": "General complaint.",
        }


class TestTriageEndpoint:
    """Test the POST /triage endpoint with three fixture scenarios."""

    @patch("routers.triage.chat_completion_json", side_effect=mock_triage_response)
    def test_harassment_critical(self, mock_llm):
        """Harassment/stalking should be classified as CRITICAL."""
        response = client.post(
            "/triage",
            json={"text": "I am being followed home every night by the same person"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["urgency"] == "CRITICAL"
        assert data["category"] == "harassment"
        assert data["confidence"] >= 0.8
        assert len(data["reasoning"]) > 0

    @patch("routers.triage.chat_completion_json", side_effect=mock_triage_response)
    def test_noise_high(self, mock_llm):
        """Noise complaints should be classified as HIGH."""
        response = client.post(
            "/triage",
            json={"text": "Loud DJ music playing past midnight every weekend in my neighborhood"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["urgency"] == "HIGH"
        assert data["category"] == "noise"
        assert data["confidence"] >= 0.8

    @patch("routers.triage.chat_completion_json", side_effect=mock_triage_response)
    def test_electricity_normal(self, mock_llm):
        """Electricity billing dispute should be classified as NORMAL."""
        response = client.post(
            "/triage",
            json={"text": "My electricity bill shows 3x consumption with no change in usage. Meter may be faulty."},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["urgency"] == "NORMAL"
        assert data["category"] == "electricity"
        assert data["confidence"] >= 0.7

    @patch("routers.triage.chat_completion_json", side_effect=mock_triage_response)
    def test_hindi_input(self, mock_llm):
        """Hindi text should be classified correctly."""
        response = client.post(
            "/triage",
            json={
                "text": "Mere ghar ke pass bahut shor hai raat ko",
                "lang": "hi",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["urgency"] == "HIGH"
        assert data["category"] == "noise"

    @patch("routers.triage.chat_completion_json", side_effect=Exception("LLM unavailable"))
    def test_graceful_degradation(self, mock_llm):
        """When LLM is down, should return a safe default (HIGH urgency)."""
        response = client.post(
            "/triage",
            json={"text": "Some complaint text"},
        )
        assert response.status_code == 200
        data = response.json()
        # Should NOT return 500 — graceful degradation
        assert data["urgency"] in ("CRITICAL", "HIGH", "NORMAL")
        assert "confidence" in data

    def test_empty_text_validation(self):
        """Empty text should still return a valid response."""
        response = client.post(
            "/triage",
            json={"text": ""},
        )
        # Should not crash — either 200 with classification or 422 validation
        assert response.status_code in (200, 422)
