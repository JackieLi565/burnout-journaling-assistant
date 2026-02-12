# Burnout Risk Analysis Service

This service provides burnout risk analysis for journal entries using LangExtract and pattern matching.

## Features

- **Text Preprocessing**: Removes emojis, normalizes unicode, segments sentences
- **Feature Extraction**: Uses LangExtract (Gemini-powered) or pattern matching fallback
- **MBI Dimension Mapping**: Maps features to Maslach Burnout Inventory dimensions:
  - **EE (Emotional Exhaustion)**: Feelings of being emotionally drained
  - **DP (Depersonalization)**: Cynical attitudes and detachment
  - **PA (Personal Accomplishment)**: Feelings of competence and achievement (inverted scoring)
- **Length Normalization**: Adjusts scores for verbose users
- **Risk Scoring**: Calculates overall burnout risk score (0-100)

## Usage

### Basic Analysis

```python
from services.burnout_analysis import BurnoutAnalysisService

# Initialize service (with optional Gemini API key)
service = BurnoutAnalysisService(api_key="your-gemini-api-key")

# Analyze text
text = "I'm so exhausted and overwhelmed. This work feels pointless."
result = service.analyze(text)

print(f"Overall Score: {result.overall_score}")
print(f"Risk Level: {result.risk_level}")
print(f"Emotional Exhaustion: {result.emotional_exhaustion.normalized_score}")
print(f"Depersonalization: {result.depersonalization.normalized_score}")
print(f"Personal Accomplishment: {result.personal_accomplishment.normalized_score}")
```

### API Endpoint

```bash
# Analyze a journal entry by ID
POST /api/v1/journals/{journal_id}/analyze

# Analyze text directly
POST /api/v1/journals/analyze
{
  "text": "Your journal text here..."
}
```

## Configuration

Set the `GEMINI_API_KEY` environment variable to enable LangExtract. If not set, the service will use pattern matching fallback.

## MBI Dictionary

The service includes comprehensive dictionaries of terms associated with each MBI dimension, based on clinical research and common usage patterns.

## Scoring

- **Overall Score**: Weighted average (EE: 40%, DP: 30%, PA: 30%)
- **Risk Levels**:
  - Low: 0-24
  - Moderate: 25-49
  - High: 50-74
  - Severe: 75-100
