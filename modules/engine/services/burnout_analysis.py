"""Burnout risk analysis service using LangExtract."""
from __future__ import annotations

from typing import List, Dict, Optional, Sequence

try:
    import langextract as lx
    LANGEXTRACT_AVAILABLE = True
except ImportError:
    LANGEXTRACT_AVAILABLE = False

from models.burnout import (
    BurnoutRiskIndex,
    BurnoutFeature,
    MBIScore,
    MBIDimension,
    EmotionType,
)
from services.preprocessing import preprocess_text


class BurnoutAnalysisService:
    """Service for analyzing burnout risk from journal text."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the burnout analysis service.
        
        Args:
            api_key: Optional API key for LangExtract/Gemini. If not provided,
                    analysis will raise because LangExtract is required.
        """
        self.api_key = api_key
        self.use_langextract = LANGEXTRACT_AVAILABLE and bool(api_key)
    
    def _extract_features_with_langextract(self, text: str, sentences: List[str]) -> List[BurnoutFeature]:
        """
        Extract features using LangExtract for each sentence, including
        per-sentence MBI dimension scores and a poor-writer flag.
        """
        features: List[BurnoutFeature] = []

        # We currently treat the entire journal text as a single unit for
        # analysis. Any segmentation done in preprocessing is ignored here.
        for sentence in sentences:
            if not sentence.strip():
                continue

            try:
                result = lx.extract(
                    text_or_documents=sentence,
                    prompt_description=(
                        "Extract burnout-related signals from a single journal sentence. "
                        "Return: emotion (negative/neutral/positive); "
                        "stress_level as a float 0-1; "
                        "has_cynical_thoughts as boolean; "
                        "burnout_markers as an array of any of "
                        "[emotional_exhaustion, depersonalization, personal_accomplishment]; "
                        "ee_score, dp_score, pa_score as numbers from 0 to 100 "
                        "representing emotional exhaustion, depersonalization, and low personal "
                        "accomplishment respectively (higher means more burnout risk on that "
                        "dimension for this sentence); and is_poor_writer as boolean when the "
                        "writing looks fragmented, grammatically weak, or very sparse but still "
                        "emotionally intense."
                    ),
                    examples=[
                        lx.data.ExampleData(
                            text="I'm so exhausted and overwhelmed with work. This is pointless.",
                            extractions=[
                                lx.data.Extraction(
                                    extraction_class="burnout_analysis",
                                    extraction_text="I'm so exhausted and overwhelmed with work. This is pointless.",
                                    attributes={
                                        "emotion": "negative",
                                        "stress_level": 0.9,
                                        "has_cynical_thoughts": True,
                                        "burnout_markers": [
                                            "emotional_exhaustion",
                                            "depersonalization",
                                        ],
                                        "ee_score": 85,
                                        "dp_score": 70,
                                        "pa_score": 20,
                                        "is_poor_writer": False,
                                    },
                                )
                            ],
                        ),
                        lx.data.ExampleData(
                            text="Today was great! I accomplished a lot and feel proud of my work.",
                            extractions=[
                                lx.data.Extraction(
                                    extraction_class="burnout_analysis",
                                    extraction_text="Today was great! I accomplished a lot and feel proud of my work.",
                                    attributes={
                                        "emotion": "positive",
                                        "stress_level": 0.1,
                                        "has_cynical_thoughts": False,
                                        "burnout_markers": ["personal_accomplishment"],
                                        "ee_score": 5,
                                        "dp_score": 5,
                                        "pa_score": 10,
                                        "is_poor_writer": False,
                                    },
                                )
                            ],
                        ),
                        lx.data.ExampleData(
                            text="I feel like I never get anything meaningful done, no matter how hard I try.",
                            extractions=[
                                lx.data.Extraction(
                                    extraction_class="burnout_analysis",
                                    extraction_text="I feel like I never get anything meaningful done, no matter how hard I try.",
                                    attributes={
                                        "emotion": "negative",
                                        "stress_level": 0.7,
                                        "has_cynical_thoughts": False,
                                        "burnout_markers": ["personal_accomplishment"],
                                        # High PA risk score: strong sense of low personal accomplishment
                                        "ee_score": 40,
                                        "dp_score": 25,
                                        "pa_score": 85,
                                        "is_poor_writer": False,
                                    },
                                )
                            ],
                        ),
                    ],
                    model_id="gemini-3.1-flash-lite-preview",
                    api_key=self.api_key,
                )

                docs = result if isinstance(result, list) else [result]
                for doc in docs:
                    extractions = getattr(doc, "extractions", []) or []
                    for extraction in extractions:
                        attrs = getattr(extraction, "attributes", {}) or {}
                        if not isinstance(attrs, dict):
                            continue

                        emotion_str = (attrs.get("emotion") or "neutral").strip().lower()
                        emotion_type = (
                            EmotionType(emotion_str)
                            if emotion_str in ("negative", "neutral", "positive")
                            else EmotionType.NEUTRAL
                        )

                        raw_stress = attrs.get("stress_level", 0)
                        try:
                            stress_level = float(raw_stress)
                        except (TypeError, ValueError):
                            stress_level = 0.0
                        stress_level = max(0.0, min(1.0, stress_level))

                        raw_cynical = attrs.get("has_cynical_thoughts", False)
                        cynical = (
                            raw_cynical is True
                            or (isinstance(raw_cynical, str) and raw_cynical.strip().lower() in ("true", "1", "yes"))
                        )

                        markers = attrs.get("burnout_markers") or []
                        if isinstance(markers, str):
                            markers = [m.strip() for m in markers.split(",") if m.strip()]

                        mbi_dimensions = []
                        if markers:
                            if "emotional_exhaustion" in markers:
                                mbi_dimensions.append(MBIDimension.EMOTIONAL_EXHAUSTION)
                            if "depersonalization" in markers:
                                mbi_dimensions.append(MBIDimension.DEPERSONALIZATION)
                            if "personal_accomplishment" in markers:
                                mbi_dimensions.append(MBIDimension.PERSONAL_ACCOMPLISHMENT)

                        # New: per-sentence MBI scores and poor-writer flag
                        def _score_from_attr(key: str, default: float) -> float:
                            raw_val = attrs.get(key, default)
                            try:
                                val = float(raw_val)
                            except (TypeError, ValueError):
                                val = default
                            return max(0.0, min(100.0, val))

                        ee_score = _score_from_attr("ee_score", 0.0)
                        dp_score = _score_from_attr("dp_score", 0.0)
                        pa_score = _score_from_attr("pa_score", 0.0)

                        # Fallback heuristics if scores are all zero: derive from markers/emotion
                        if ee_score == 0.0 and "emotional_exhaustion" in markers:
                            ee_score = max(ee_score, stress_level * 100.0)
                        if dp_score == 0.0 and "depersonalization" in markers:
                            dp_score = max(dp_score, stress_level * 100.0 * 0.8)
                        if pa_score == 0.0 and "personal_accomplishment" in markers:
                            # Higher PA terms = lower burnout; invert into risk-ish score
                            pa_score = max(pa_score, 100.0 - stress_level * 100.0)

                        raw_poor = attrs.get("is_poor_writer", False)
                        is_poor_writer = (
                            raw_poor is True
                            or (isinstance(raw_poor, str) and raw_poor.strip().lower() in ("true", "1", "yes"))
                        )

                        feature = BurnoutFeature(
                            emotion_type=emotion_type,
                            stress_level=stress_level,
                            cynical_thoughts=cynical,
                            mbi_dimension=mbi_dimensions,
                            confidence=0.8,
                            ee_score=ee_score,
                            dp_score=dp_score,
                            pa_score=pa_score,
                            is_poor_writer=is_poor_writer,
                        )
                        features.append(feature)

            except Exception as e:
                # LangExtract is required per product spec; fail fast so callers can surface it.
                raise RuntimeError(f"LangExtract failed for sentence: {e}") from e

        return features
    
    def _calculate_mbi_scores(self, features: List[BurnoutFeature], text: str, text_length: int) -> Dict[MBIDimension, MBIScore]:
        """
        Calculate MBI dimension scores from extracted features.
        
        Args:
            features: List of extracted features
            text: Original cleaned text (unused; kept for signature stability)
            text_length: Length of processed text for normalization
        
        Returns:
            Dictionary mapping MBI dimensions to scores
        """
        # Aggregate LangExtract-provided per-sentence dimension scores
        sum_scores: Dict[MBIDimension, float] = {
            MBIDimension.EMOTIONAL_EXHAUSTION: 0.0,
            MBIDimension.DEPERSONALIZATION: 0.0,
            MBIDimension.PERSONAL_ACCOMPLISHMENT: 0.0,
        }
        counts: Dict[MBIDimension, int] = {
            MBIDimension.EMOTIONAL_EXHAUSTION: 0,
            MBIDimension.DEPERSONALIZATION: 0,
            MBIDimension.PERSONAL_ACCOMPLISHMENT: 0,
        }

        for feature in features:
            if feature.ee_score > 0.0:
                sum_scores[MBIDimension.EMOTIONAL_EXHAUSTION] += feature.ee_score
                counts[MBIDimension.EMOTIONAL_EXHAUSTION] += 1
            if feature.dp_score > 0.0:
                sum_scores[MBIDimension.DEPERSONALIZATION] += feature.dp_score
                counts[MBIDimension.DEPERSONALIZATION] += 1
            if feature.pa_score > 0.0:
                sum_scores[MBIDimension.PERSONAL_ACCOMPLISHMENT] += feature.pa_score
                counts[MBIDimension.PERSONAL_ACCOMPLISHMENT] += 1

        mbi_scores: Dict[MBIDimension, MBIScore] = {}
        for dim in MBIDimension:
            count = counts[dim]
            if count > 0:
                avg_score = sum_scores[dim] / count
            else:
                avg_score = 0.0

            mbi_scores[dim] = MBIScore(
                dimension=dim,
                raw_score=avg_score,
                normalized_score=avg_score,
                frequency=count,
            )

        return mbi_scores
    
    def _calculate_overall_score(self, mbi_scores: Dict[MBIDimension, MBIScore], text_length: int) -> float:
        """
        Calculate overall burnout risk score (BRI) from LangExtract scores.

        - Uses the per-sentence `bri_score` values returned by LangExtract.
        - Weights sentences from poor writers (`is_poor_writer=True`) higher.
        - Applies a light length-based normalization so very short texts have
          slightly down-weighted scores.
        """
        if not mbi_scores:
            return 0.0
        # Use dimension-level scores from LangExtract and apply explicit weights
        ee_score = mbi_scores[MBIDimension.EMOTIONAL_EXHAUSTION].normalized_score
        dp_score = mbi_scores[MBIDimension.DEPERSONALIZATION].normalized_score
        pa_score = mbi_scores[MBIDimension.PERSONAL_ACCOMPLISHMENT].normalized_score

        # Weights can be tuned; keep EE a bit higher-weighted.
        overall_base = (ee_score * 0.45) + (dp_score * 0.35) + (pa_score * 0.20)

        # Normalize by text length so extremely short texts don't over-dominate.
        # base_length = 300
        # length_factor = min(1.0, text_length / base_length) if text_length > 0 else 0.0
        # overall = overall_base * length_factor

        return float(max(0.0, min(100.0, overall_base)))
    
    def analyze(self, text: str) -> BurnoutRiskIndex:
        """
        Analyze text for burnout risk.
        
        Args:
            text: Journal entry text to analyze
        
        Returns:
            BurnoutRiskIndex with scores and analysis
        """
        if not self.use_langextract:
            raise RuntimeError("LangExtract is required (missing dependency or API key).")

        # Step 1: Preprocessing
        cleaned_text, sentences = preprocess_text(text)
        text_length = len(cleaned_text)
        
        # Step 2: Feature extraction
        # Do not split into multiple sentences for scoring; analyze the full text
        # as a single unit so the BRI reflects the whole journal input.
        features = self._extract_features_with_langextract(cleaned_text, [cleaned_text])
        # Step 3: Calculate MBI scores using LangExtract-provided dimension scores
        mbi_scores = self._calculate_mbi_scores(features, cleaned_text, text_length)
        # Step 4: Calculate overall BRI from MBI dimension scores
        overall_score = self._calculate_overall_score(mbi_scores, text_length)
        # Step 5: Determine risk level
        if overall_score < 25:
            risk_level = "low"
        elif overall_score < 50:
            risk_level = "moderate"
        elif overall_score < 75:
            risk_level = "high"
        else:
            risk_level = "severe"
        
        # Create result
        result = BurnoutRiskIndex(
            overall_score=overall_score,
            emotional_exhaustion=mbi_scores[MBIDimension.EMOTIONAL_EXHAUSTION],
            depersonalization=mbi_scores[MBIDimension.DEPERSONALIZATION],
            personal_accomplishment=mbi_scores[MBIDimension.PERSONAL_ACCOMPLISHMENT],
            features=features,
            text_length=text_length,
            sentence_count=len(sentences),
            risk_level=risk_level
        )
        
        return result

    def analyze_journal_inputs(self, journal_inputs: Sequence[str]) -> BurnoutRiskIndex:
        """
        Analyze multiple journal inputs as a single journal for a final BRI.

        This is used when a journal date has multiple entry inputs; we combine
        all inputs so the final BRI reflects the entire journal, not one entry.
        """
        combined = "\n\n---\n\n".join([t for t in journal_inputs if (t or "").strip()])
        return self.analyze(combined)

    @staticmethod
    def compute_cumulative_bri(
        *,
        previous_cumulative_bri: Optional[float],
        new_final_bri: float,
    ) -> float:
        """
        Compute a new cumulative BRI.

        Uses only the previous cumulative BRI (if any) and the current
        journal's final BRI; it does not re-analyze or weight historical
        journals.
        """
        if previous_cumulative_bri is None:
            # First journal: cumulative == current final score
            base = 0
        else:
            base = previous_cumulative_bri

        # Exponential moving average toward the new final BRI.
        alpha = 0.35
        ema = (base * (1.0 - alpha)) + (new_final_bri * alpha)

        return float(max(0.0, min(100.0, ema)))

#Test run of langextract python -m services.burnout_analysis for testing langextract
if __name__ == "__main__":
    import os
    import sys

    # Allow running as script from engine root: python -m services.burnout_analysis
    engine_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if engine_root not in sys.path:
        sys.path.insert(0, engine_root)
    os.chdir(engine_root)

    # Optional: load .env for GEMINI_API_KEY
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    api_key = os.getenv("GEMINI_API_KEY", "")
    service = BurnoutAnalysisService(api_key=api_key or None)

    sample_text = """
    I'm so exhausted and overwhelmed with work.
    I don't care anymore about the meetings.
    Today I actually accomplished something
    and felt proud of the progress.
    But the stress is still there.
    """

    print("Burnout Analysis Service – test run")
    print("Using LangExtract:", service.use_langextract)
    print("-" * 50)

    result = service.analyze(sample_text)

    print("Overall score:", result.overall_score)
    print("Risk level:", result.risk_level)
    print("Text length:", result.text_length)
    print("Sentence count:", result.sentence_count)
    print("EE (normalized):", result.emotional_exhaustion.normalized_score)
    print("DP (normalized):", result.depersonalization.normalized_score)
    print("PA (normalized):", result.personal_accomplishment.normalized_score)
    print("Features extracted:", len(result.features))
    print("-" * 50)
    print("OK – burnout analysis ran successfully.")
