"""Text preprocessing utilities for burnout analysis."""
import re
import unicodedata
from typing import List
import nltk
from nltk.tokenize import sent_tokenize

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

def remove_emojis(text: str) -> str:
    """Remove emojis and other unicode symbols from text."""
    # Remove emojis
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags (iOS)
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "]+",
        flags=re.UNICODE
    )
    text = emoji_pattern.sub('', text)
    
    # Remove other unicode symbols
    text = re.sub(r'[^\w\s\.\,\!\?\;\:\-]', '', text)
    
    return text

def normalize_unicode(text: str) -> str:
    """Normalize unicode characters to their canonical form."""
    # Normalize to NFC (Canonical Decomposition, followed by Canonical Composition)
    text = unicodedata.normalize('NFC', text)
    
    # Replace common unicode variations with ASCII equivalents
    replacements = {
        '\u2018': "'",  # Left single quotation mark
        '\u2019': "'",  # Right single quotation mark
        '\u201C': '"',  # Left double quotation mark
        '\u201D': '"',  # Right double quotation mark
        '\u2013': '-',  # En dash
        '\u2014': '-',  # Em dash
        '\u2026': '...',  # Horizontal ellipsis
    }
    
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text

def remove_extra_whitespace(text: str) -> str:
    """Remove extra whitespace and normalize spacing."""
    # Replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    # Remove leading/trailing whitespace
    text = text.strip()
    return text

def segment_sentences(text: str) -> List[str]:
    """Segment text into sentences."""
    try:
        sentences = sent_tokenize(text)
        # Filter out empty sentences
        sentences = [s.strip() for s in sentences if s.strip()]
        return sentences
    except Exception:
        # Fallback to simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip()]
        return sentences

def preprocess_text(text: str) -> tuple[str, List[str]]:
    """
    Complete preprocessing pipeline.
    
    Returns:
        tuple: (cleaned_text, sentences)
    """
    # Step 1: Remove emojis
    text = remove_emojis(text)
    
    # Step 2: Normalize unicode
    text = normalize_unicode(text)
    
    # Step 3: Remove extra whitespace
    text = remove_extra_whitespace(text)
    
    # Step 4: Segment sentences
    sentences = segment_sentences(text)
    
    return text, sentences
