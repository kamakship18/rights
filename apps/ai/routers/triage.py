"""
POST /triage — Classify grievance urgency and category.

Uses Groq LLM with a few-shot classifier prompt and strict JSON output.
Never hallucinates categories — uses a fixed taxonomy.
"""

import logging

from fastapi import APIRouter

from models import TriageRequest, TriageResponse
from services.groq_client import chat_completion_json

logger = logging.getLogger(__name__)
router = APIRouter(tags=["triage"])

TRIAGE_SYSTEM_PROMPT = """You are a legal grievance triage system for India. Your job is to classify a citizen's complaint into an urgency level and a category.

## Urgency Levels
- CRITICAL: Immediate physical danger, harassment, stalking, assault, threats to life, domestic violence, kidnapping, sexual harassment.
- HIGH: Significant disturbance or rights violation that needs attention within days. Noise pollution, property damage, ongoing consumer fraud, repeated electricity issues.
- NORMAL: Routine complaints that can wait for standard processing. Billing disputes, minor municipal issues, general consumer complaints.

## Categories (use exactly one)
harassment, stalking, assault, domestic_violence, noise, electricity, consumer, municipal, property, cybercrime, traffic, corruption, other

## Rules
1. Always return valid JSON with keys: urgency, category, confidence, reasoning.
2. confidence is a float between 0 and 1.
3. reasoning should be a brief 1-2 sentence explanation.
4. If the text is in a language other than English, still classify it correctly.
5. When in doubt between CRITICAL and HIGH, choose CRITICAL (err on the side of safety).

## Few-shot examples

Input: "I am being followed home every night by the same man"
Output: {"urgency": "CRITICAL", "category": "stalking", "confidence": 0.95, "reasoning": "Stalking behavior described with repeated pattern, indicating immediate personal safety threat."}

Input: "Mere ghar ke pass bahut shor hai raat ko. DJ 1 baje tak bajta hai har weekend."
Output: {"urgency": "HIGH", "category": "noise", "confidence": 0.92, "reasoning": "Noise pollution complaint — loud DJ playing past midnight on weekends, violating noise rules."}

Input: "My electricity bill for March shows 3x the usual consumption despite no change in usage."
Output: {"urgency": "NORMAL", "category": "electricity", "confidence": 0.88, "reasoning": "Billing dispute related to suspected faulty meter. No immediate safety concern."}

Input: "Someone is harassing me at my workplace and making inappropriate comments"
Output: {"urgency": "CRITICAL", "category": "harassment", "confidence": 0.93, "reasoning": "Workplace sexual harassment reported — requires immediate attention under POSH Act."}

Input: "The street lights in my colony have not been working for 2 months"
Output: {"urgency": "NORMAL", "category": "municipal", "confidence": 0.85, "reasoning": "Municipal infrastructure complaint about non-functional street lights."}
"""


@router.post("/triage", response_model=TriageResponse)
async def triage(request: TriageRequest):
    """
    Classify a grievance text into urgency level and category.

    Returns structured classification with confidence and reasoning.
    Degrades gracefully if the LLM is unavailable.
    """
    try:
        result = chat_completion_json(
            TRIAGE_SYSTEM_PROMPT,
            f"Classify this grievance:\n\n{request.text}",
            temperature=0.1,
            max_tokens=512,
        )

        # Validate urgency
        urgency = result.get("urgency", "NORMAL").upper()
        if urgency not in ("CRITICAL", "HIGH", "NORMAL"):
            urgency = "NORMAL"

        # Validate category
        valid_categories = {
            "harassment", "stalking", "assault", "domestic_violence",
            "noise", "electricity", "consumer", "municipal",
            "property", "cybercrime", "traffic", "corruption", "other",
        }
        category = result.get("category", "other").lower()
        if category not in valid_categories:
            category = "other"

        return TriageResponse(
            urgency=urgency,
            category=category,
            confidence=min(1.0, max(0.0, float(result.get("confidence", 0.7)))),
            reasoning=result.get("reasoning", "Classification based on content analysis."),
        )

    except Exception as e:
        logger.error("Triage failed: %s", e)
        # Graceful degradation: return a safe default
        # For safety, default to HIGH urgency so it gets attention
        return TriageResponse(
            urgency="HIGH",
            category="other",
            confidence=0.3,
            reasoning=f"Auto-classified (LLM unavailable): {str(e)[:100]}. Defaulting to HIGH urgency for safety.",
        )
