"""Burnout risk analysis models."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from enum import Enum

class MBIDimension(str, Enum):
    """Maslach Burnout Inventory dimensions."""
    EMOTIONAL_EXHAUSTION = "EE"
    DEPERSONALIZATION = "DP"
    PERSONAL_ACCOMPLISHMENT = "PA"

class EmotionType(str, Enum):
    """Emotion classification types."""
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    POSITIVE = "positive"

class BurnoutFeature(BaseModel):
    """Extracted feature from text analysis."""
    emotion_type: EmotionType
    stress_level: float = Field(ge=0.0, le=1.0, description="Stress level from 0 to 1")
    cynical_thoughts: bool = Field(default=False, description="Presence of cynical thoughts")
    mbi_dimension: List[MBIDimension] = Field(default_factory=list, description="Associated MBI dimension")
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score for this feature")
    ee_score: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Sentence-level emotional exhaustion score (0-100) from LangExtract",
    )
    dp_score: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Sentence-level depersonalization score (0-100) from LangExtract",
    )
    pa_score: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Sentence-level personal accomplishment score (0-100) from LangExtract",
    )
    is_poor_writer: bool = Field(
        default=False,
        description="Whether this sentence appears to come from a poor writer (for weighting)",
    )

class MBIScore(BaseModel):
    """MBI dimension score."""
    dimension: MBIDimension
    raw_score: float = Field(ge=0.0, description="Raw frequency-based score")
    normalized_score: float = Field(ge=0.0, le=100.0, description="Normalized score 0-100")
    frequency: int = Field(ge=0, description="Number of occurrences")

class BurnoutRiskIndex(BaseModel):
    """Burnout risk index result."""
    base_score: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Base burnout risk score before optional coach modifiers (0-100)",
    )
    overall_score: float = Field(ge=0.0, le=100.0, description="Overall burnout risk score (0-100)")
    cumulative_bri: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Cumulative burnout risk index (0-100)")
    coach_modifier: float = Field(
        default=0.0,
        ge=-3.0,
        le=5.0,
        description="Optional modifier derived from live coach transcript context",
    )
    coach_used: bool = Field(
        default=False,
        description="Whether a separate live coach transcript contributed to the final score",
    )
    emotional_exhaustion: MBIScore
    depersonalization: MBIScore
    personal_accomplishment: MBIScore
    features: List[BurnoutFeature] = Field(default_factory=list, description="Extracted features")
    text_length: int = Field(ge=0, description="Length of processed text")
    sentence_count: int = Field(ge=0, description="Number of sentences")
    risk_level: str = Field(default="low", description="Risk level: low, moderate, high, severe")
    
    def model_post_init(self, __context):
        """Calculate risk level based on overall score."""
        if self.overall_score < 25:
            object.__setattr__(self, "risk_level", "low")
        elif self.overall_score < 50:
            object.__setattr__(self, "risk_level", "moderate")
        elif self.overall_score < 75:
            object.__setattr__(self, "risk_level", "high")
        else:
            object.__setattr__(self, "risk_level", "severe")

class AnalysisRequest(BaseModel):
    """Request model for burnout analysis."""
    journal_id: Optional[str] = Field(default=None, description="Journal entry ID to analyze")
    text: Optional[str] = Field(default=None, description="Optional text to analyze directly")
    texts: Optional[List[str]] = Field(default=None, description="Optional list of journal input texts to analyze together")
    user_id: Optional[str] = Field(default=None, description="Optional user ID (for cumulative BRI calculation)")
    journal_date: Optional[str] = Field(default=None, description="Optional journal date (yyyy-mm-dd) for cumulative BRI calculation")
    coach_transcript: Optional[str] = Field(
        default=None,
        description="Optional live coach conversation transcript used as a context modifier",
    )
    coach_transcript_embedded: bool = Field(
        default=False,
        description="Whether the coach transcript is already embedded in the journal text",
    )
