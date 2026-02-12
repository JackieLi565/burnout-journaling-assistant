"""Burnout risk analysis service using LangExtract."""
import re
from typing import List, Dict, Optional
from collections import Counter

try:
    import langextract as lx
    LANGEXTRACT_AVAILABLE = True
except ImportError:
    LANGEXTRACT_AVAILABLE = False
    # Fallback mode - will use pattern matching instead

from models.burnout import (
    BurnoutRiskIndex,
    BurnoutFeature,
    MBIScore,
    MBIDimension,
    EmotionType,
)
from services.preprocessing import preprocess_text
from services.mbi_dictionary import (
    MBI_TERMS,
    STRESS_PATTERNS,
    CYNICAL_PATTERNS,
    get_terms_for_dimension,
)


class BurnoutAnalysisService:
    """Service for analyzing burnout risk from journal text."""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the burnout analysis service.
        
        Args:
            api_key: Optional API key for LangExtract/Gemini. If not provided,
                    will use pattern matching fallback.
        """
        self.api_key = api_key
        self.use_langextract = LANGEXTRACT_AVAILABLE and api_key is not None
        
        # Compile regex patterns for faster matching
        self._compile_patterns()
    
    def _compile_patterns(self):
        """Compile regex patterns for term matching."""
        self.mbi_patterns: Dict[MBIDimension, List[re.Pattern]] = {}
        for dimension, terms in MBI_TERMS.items():
            patterns = []
            for term in terms:
                # Word boundary matching for better accuracy
                pattern = re.compile(r'\b' + re.escape(term.lower()) + r'\b', re.IGNORECASE)
                patterns.append(pattern)
            self.mbi_patterns[dimension] = patterns
        
        # Stress patterns
        self.stress_patterns = [
            re.compile(r'\b' + re.escape(term.lower()) + r'\b', re.IGNORECASE)
            for term in STRESS_PATTERNS
        ]
        
        # Cynical patterns
        self.cynical_patterns = [
            re.compile(r'\b' + re.escape(term.lower()) + r'\b', re.IGNORECASE)
            for term in CYNICAL_PATTERNS
        ]
    
    def _extract_features_with_langextract(self, text: str, sentences: List[str]) -> List[BurnoutFeature]:
        """
        Extract features using LangExtract.
        
        This uses LangExtract to classify emotions and extract burnout markers.
        """
        features = []
        
        # Define schema for LangExtract
        schema = {
            "type": "object",
            "properties": {
                "emotion": {
                    "type": "string",
                    "enum": ["negative", "neutral", "positive"]
                },
                "stress_level": {
                    "type": "number",
                    "minimum": 0,
                    "maximum": 1
                },
                "has_cynical_thoughts": {
                    "type": "boolean"
                },
                "burnout_markers": {
                    "type": "array",
                    "items": {
                        "type": "string",
                        "enum": ["emotional_exhaustion", "depersonalization", "personal_accomplishment"]
                    }
                }
            },
            "required": ["emotion", "stress_level"]
        }
        
        try:
            # Process each sentence
            for sentence in sentences:
                if not sentence.strip():
                    continue
                
                try:
                    # Extract structured data from sentence using LangExtract
                    result = lx.extract(
                        text_or_documents=sentence,
                        prompt_description=(
                            "Extract burnout-related signals from journal text. "
                            "Return emotion (negative/neutral/positive), "
                            "stress_level as a float between 0 and 1, "
                            "has_cynical_thoughts as boolean, "
                            "and burnout_markers as a list (array of ONLY these values: "
                            "emotional_exhaustion, depersonalization, personal_accomplishment)"
                        ),
                        examples=[
                            lx.data.ExampleData(
                                text="I'm so exhausted and overwhelmed with work. This is pointless.",
                                extractions=[
                                    lx.data.Extraction(
                                        extraction_class="burnout_analysis",
                                        extraction_text="exhausted",
                                        attributes={"emotion": "negative", "stress_level": 0.9, "has_cynical_thoughts": True, "burnout_markers": ["emotional_exhaustion", "depersonalization"]}
                                    )
                                ]
                            ),
                            lx.data.ExampleData(
                                text="Today was great! I accomplished a lot and feel proud of my work.",
                                extractions=[
                                    lx.data.Extraction(
                                        extraction_class="burnout_analysis",
                                        extraction_text="proud",
                                        attributes={"emotion": "positive", "stress_level": 0.1, "has_cynical_thoughts": False, "burnout_markers": ["personal_accomplishment"]}
                                    )
                                ]
                            )
                        ],
                        model_id="gemini-2.5-flash",
                        api_key= self.api_key
                    )
                    # LangExtract returns AnnotatedDocument(extractions=[Extraction(...)], text=...)
                    #AnnotatedDocument(extractions=[Extraction(extraction_class='burnout_analysis', extraction_text='exhausted', char_interval=CharInterval(start_pos=6, end_pos=15), alignment_status=<AlignmentStatus.MATCH_EXACT: 'match_exact'>, extraction_index=1, group_index=0, description=None, attributes={'emotion': 'negative', 'stress_level': '0.8', 'has_cynical_thoughts': 'false', 'burnout_markers': ['emotional_exhaustion']})], text='Im so exhausted and overwhelmed with work')
                    # Handle single document or list of documents
                    docs = result if isinstance(result, list) else [result]
                    got_extractions_this_sentence = False
                    for doc in docs:
                        extractions = getattr(doc, "extractions", []) or []
                        for extraction in extractions:
                            attrs = getattr(extraction, "attributes", {}) or {}
                            if not isinstance(attrs, dict):
                                continue
                            got_extractions_this_sentence = True
                            # Attributes may be returned as strings (e.g. '0.8', 'false')
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
                            feature = BurnoutFeature(
                                emotion_type=emotion_type,
                                stress_level=stress_level,
                                cynical_thoughts=cynical,
                                mbi_dimension=mbi_dimensions,
                                confidence=0.8,
                            )
                            features.append(feature)
                    # If no extractions for this sentence, fall back to pattern matching
                    if not got_extractions_this_sentence and sentence.strip():
                        fallback = self._extract_features_pattern_matching(sentence)
                        if fallback:
                            features.append(fallback)
                
                except Exception as e:
                    # Fallback to pattern matching for this sentence
                    print(f"LangExtract failed for sentence, using fallback: {e}")
                    feature = self._extract_features_pattern_matching(sentence)
                    if feature:
                        features.append(feature)
        
        except Exception as e:
            print(f"LangExtract extraction failed, falling back to pattern matching: {e}")
            # Fallback to pattern matching
            return self._extract_features_pattern_matching_batch(text, sentences)
        
        return features
    
    def _extract_features_pattern_matching(self, text: str) -> Optional[BurnoutFeature]:
        """
        Extract features using pattern matching (fallback method).
        
        This is used when LangExtract is not available or fails.
        """
        text_lower = text.lower()
        
        # Detect stress level
        stress_matches = sum(1 for pattern in self.stress_patterns if pattern.search(text_lower))
        stress_level = min(1.0, stress_matches / max(1, len(self.stress_patterns) / 10))
        
        # Detect cynical thoughts
        cynical_thoughts = any(pattern.search(text_lower) for pattern in self.cynical_patterns)
        
        # Detect emotion (simple heuristic)
        negative_words = ["not", "no", "never", "can't", "won't", "don't", "hate", "angry", "frustrated", "sad", "depressed"]
        positive_words = ["good", "great", "excellent", "happy", "pleased", "satisfied", "proud", "accomplished"]
        
        negative_count = sum(1 for word in negative_words if word in text_lower)
        positive_count = sum(1 for word in positive_words if word in text_lower)
        
        if negative_count > positive_count:
            emotion_type = EmotionType.NEGATIVE
        elif positive_count > negative_count:
            emotion_type = EmotionType.POSITIVE
        else:
            emotion_type = EmotionType.NEUTRAL
        
        # Detect MBI dimension
        mbi_dimensions = []
        max_matches = 0
        
        for dimension, patterns in self.mbi_patterns.items():
            matches = sum(1 for pattern in patterns if pattern.search(text_lower))
            if matches > max_matches:
                max_matches = matches
                mbi_dimensions.append(dimension)
        
        if max_matches == 0:
            mbi_dimensions = []
        
        return BurnoutFeature(
            emotion_type=emotion_type,
            stress_level=stress_level,
            cynical_thoughts=cynical_thoughts,
            mbi_dimension=mbi_dimensions,
            confidence=0.6  # Lower confidence for pattern matching
        )
    
    def _extract_features_pattern_matching_batch(self, text: str, sentences: List[str]) -> List[BurnoutFeature]:
        """Extract features for all sentences using pattern matching."""
        features = []
        for sentence in sentences:
            feature = self._extract_features_pattern_matching(sentence)
            if feature:
                features.append(feature)
        return features
    
    def _calculate_mbi_scores(self, features: List[BurnoutFeature], text: str, text_length: int) -> Dict[MBIDimension, MBIScore]:
        """
        Calculate MBI dimension scores from extracted features.
        
        Args:
            features: List of extracted features
            text: Original cleaned text for direct term matching
            text_length: Length of processed text for normalization
        
        Returns:
            Dictionary mapping MBI dimensions to scores
        """
        # Count frequencies for each dimension from features
        dimension_counts: Dict[MBIDimension, int] = {
            MBIDimension.EMOTIONAL_EXHAUSTION: 0,
            MBIDimension.DEPERSONALIZATION: 0,
            MBIDimension.PERSONAL_ACCOMPLISHMENT: 0,
        }
        
        # Count occurrences from features
        for feature in features:
            if feature.mbi_dimension:
                for dimension in feature.mbi_dimension:
                    dimension_counts[dimension] += 1
        
        # Also count direct term matches in text (for better coverage)
        text_lower = text.lower()
        for dimension, patterns in self.mbi_patterns.items():
            matches = sum(1 for pattern in patterns if pattern.search(text_lower))
            # Add direct matches to the count
            dimension_counts[dimension] += matches
        
        # Calculate raw scores (frequency-based)
        raw_scores = {}
        for dimension in MBIDimension:
            frequency = dimension_counts[dimension]
            raw_scores[dimension] = frequency
        
        # Normalize scores (0-100 scale)
        # Use length normalization to account for verbose users
        normalized_scores = {}
        base_length = 500  # Baseline length for normalization
        
        for dimension in MBIDimension:
            raw_score = raw_scores[dimension]
            
            # Length normalization: adjust frequency based on text length
            if text_length > 0:
                length_factor = base_length / max(text_length, base_length)
                normalized_frequency = raw_score * length_factor
            else:
                normalized_frequency = raw_score
            
            # Convert to 0-100 scale
            # For EE and DP: higher frequency = higher score (higher burnout risk)
            # For PA: higher frequency = lower score (lower burnout risk, as it's inverted)
            if dimension == MBIDimension.PERSONAL_ACCOMPLISHMENT:
                # Inverted: more PA terms = lower burnout risk
                # Scale: 0 occurrences = 100 (high burnout), many occurrences = 0 (low burnout)
                max_expected = 20  # Expected max occurrences in a typical entry
                normalized_score = max(0, 100 - (normalized_frequency / max_expected * 100))
            else:
                # EE and DP: more occurrences = higher burnout risk
                max_expected = 15  # Expected max occurrences
                normalized_score = min(100, (normalized_frequency / max_expected * 100))
            
            normalized_scores[dimension] = normalized_score
        
        # Create MBIScore objects
        mbi_scores = {}
        for dimension in MBIDimension:
            mbi_scores[dimension] = MBIScore(
                dimension=dimension,
                raw_score=raw_scores[dimension],
                normalized_score=normalized_scores[dimension],
                frequency=int(raw_scores[dimension])
            )
        
        return mbi_scores
    
    def _calculate_overall_score(self, mbi_scores: Dict[MBIDimension, MBIScore]) -> float:
        """
        Calculate overall burnout risk score from MBI dimension scores.
        
        Formula: Weighted average of EE, DP, and inverted PA
        """
        ee_score = mbi_scores[MBIDimension.EMOTIONAL_EXHAUSTION].normalized_score
        dp_score = mbi_scores[MBIDimension.DEPERSONALIZATION].normalized_score
        pa_score = mbi_scores[MBIDimension.PERSONAL_ACCOMPLISHMENT].normalized_score
        # Weights: EE (40%), DP (30%), PA (30%)
        overall = (ee_score * 0.4) + (dp_score * 0.3) + (pa_score * 0.3)
        
        return min(100.0, max(0.0, overall))
    
    def analyze(self, text: str) -> BurnoutRiskIndex:
        """
        Analyze text for burnout risk.
        
        Args:
            text: Journal entry text to analyze
        
        Returns:
            BurnoutRiskIndex with scores and analysis
        """
        # Step 1: Preprocessing
        cleaned_text, sentences = preprocess_text(text)
        text_length = len(cleaned_text)
        
        # Step 2: Feature extraction
        if self.use_langextract:
            features = self._extract_features_with_langextract(cleaned_text, sentences)
        else:
            features = self._extract_features_pattern_matching_batch(cleaned_text, sentences)
        # Step 3: Calculate MBI scores
        mbi_scores = self._calculate_mbi_scores(features, cleaned_text, text_length)
        # Step 4: Calculate overall score
        overall_score = self._calculate_overall_score(mbi_scores)
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

#Test run of langextract python -m services.burnout_analysis for testing langextract
# if __name__ == "__main__":
#     import os
#     import sys

#     # Allow running as script from engine root: python -m services.burnout_analysis
#     engine_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
#     if engine_root not in sys.path:
#         sys.path.insert(0, engine_root)
#     os.chdir(engine_root)

#     # Optional: load .env for GEMINI_API_KEY
#     try:
#         from dotenv import load_dotenv
#         load_dotenv()
#     except ImportError:
#         pass

#     api_key = os.getenv("GEMINI_API_KEY", "")
#     service = BurnoutAnalysisService(api_key=api_key or None)

#     sample_text = """
#     I'm so exhausted and overwhelmed with work.
#     I don't care anymore about the meetings.
#     Today I actually accomplished something
#     and felt proud of the progress.
#     But the stress is still there.
#     """

#     print("Burnout Analysis Service – test run")
#     print("Using LangExtract:", service.use_langextract)
#     print("-" * 50)

#     result = service.analyze(sample_text)

#     print("Overall score:", result.overall_score)
#     print("Risk level:", result.risk_level)
#     print("Text length:", result.text_length)
#     print("Sentence count:", result.sentence_count)
#     print("EE (normalized):", result.emotional_exhaustion.normalized_score)
#     print("DP (normalized):", result.depersonalization.normalized_score)
#     print("PA (normalized):", result.personal_accomplishment.normalized_score)
#     print("Features extracted:", len(result.features))
#     print("-" * 50)
#     print("OK – burnout analysis ran successfully.")
