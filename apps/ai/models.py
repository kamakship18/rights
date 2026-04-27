"""
Pydantic models for request/response schemas across all AI endpoints.
"""

from pydantic import BaseModel, Field

# ─── Triage ─────────────────────────────────────────────


class TriageRequest(BaseModel):
    text: str = Field(..., description="User's grievance description in natural language")
    lang: str | None = Field(default=None, description="ISO 639-1 language code (auto-detected if omitted)")


class TriageResponse(BaseModel):
    urgency: str = Field(..., description="CRITICAL | HIGH | NORMAL")
    category: str = Field(..., description="Grievance category (harassment, noise, electricity, etc.)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence score")
    reasoning: str = Field(..., description="Brief explanation for the classification")


# ─── Statute Mapping ────────────────────────────────────


class Citation(BaseModel):
    source: str = Field(..., description="Source document or database")
    snippet: str = Field(..., description="Relevant text excerpt")
    url: str = Field(default="", description="URL to the full text")


class StatuteRequest(BaseModel):
    text: str = Field(..., description="Grievance text")
    category: str = Field(..., description="Category from triage step")


class StatuteResponse(BaseModel):
    statute: str = Field(..., description="Full statute name")
    section: str = Field(..., description="Specific section/rule number")
    citations: list[Citation] = Field(default_factory=list, description="Supporting citations")
    confidence: float = Field(..., ge=0.0, le=1.0)
    needs_lawyer_review: bool = Field(default=False)
    reasoning: str = Field(default="", description="Why this statute was selected")


# ─── Officer Lookup ─────────────────────────────────────


class OfficerResult(BaseModel):
    id: str
    name: str
    designation: str
    department: str
    jurisdiction_pin: str
    email: str


class OfficerResponse(BaseModel):
    officer: OfficerResult
    parent: OfficerResult | None = None
    source: str = Field(default="sql", description="How the officer was found: sql | vector")


# ─── Error / Fallback ──────────────────────────────────


class GracefulError(BaseModel):
    needs_lawyer_review: bool = True
    explanation: str
    partial_result: dict | None = None
