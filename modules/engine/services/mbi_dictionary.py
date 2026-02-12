"""MBI (Maslach Burnout Inventory) dimension term dictionary."""
from typing import Dict, List
from models.burnout import MBIDimension

# MBI Dimension Term Dictionaries
# These terms are associated with each dimension based on research and clinical usage

MBI_TERMS: Dict[MBIDimension, List[str]] = {
    MBIDimension.EMOTIONAL_EXHAUSTION: [
        # Direct exhaustion terms
        "exhausted", "exhaustion", "drained", "drained out", "worn out", "burned out",
        "burnout", "fatigued", "tired", "weary", "spent", "depleted", "empty",
        "overwhelmed", "overwhelming", "overloaded", "stressed", "stress", "stressing",
        "pressure", "pressured", "pressuring", "strained", "straining",
        
        # Emotional depletion
        "emotionally drained", "emotionally exhausted", "emotionally depleted",
        "can't cope", "can't handle", "unable to cope", "unable to handle",
        "too much", "too many", "can't take it", "can't deal",
        
        # Energy-related
        "no energy", "low energy", "lack energy", "energy depleted", "energy drained",
        "running on empty", "running out of steam", "hitting a wall",
        
        # Sleep and rest issues
        "can't sleep", "insomnia", "restless", "tossing and turning",
        "wake up tired", "never rested", "no rest",
        
        # Work-related exhaustion
        "work overload", "too much work", "work stress", "work pressure",
        "deadline pressure", "meeting fatigue", "meeting exhaustion",
    ],
    
    MBIDimension.DEPERSONALIZATION: [
        # Detachment and cynicism
        "cynical", "cynicism", "detached", "detachment", "disconnected", "disconnection",
        "disengaged", "disengagement", "distant", "distance", "withdrawn", "withdrawal",
        "numb", "numbness", "indifferent", "indifference", "apathetic", "apathy",
        "don't care", "don't care anymore", "stopped caring", "lost interest",
        
        # Negative attitudes toward others
        "blame others", "blaming others", "fault of others", "others' fault",
        "people are", "they are", "they don't", "they can't", "they won't",
        "clients are", "patients are", "students are", "customers are",
        "dehumanizing", "treating like numbers", "treating like objects",
        
        # Reduced empathy
        "lost empathy", "no empathy", "can't empathize", "don't empathize",
        "don't feel for", "don't relate to", "can't relate",
        
        # Cynical thoughts about work
        "pointless", "meaningless", "doesn't matter", "doesn't make a difference",
        "waste of time", "waste of effort", "going through motions",
        "just a job", "just work", "it's just work",
        
        # Negative labeling
        "difficult", "impossible", "hopeless", "useless", "worthless",
        "annoying", "irritating", "frustrating", "infuriating",
    ],
    
    MBIDimension.PERSONAL_ACCOMPLISHMENT: [
        # Positive accomplishment (inverted - lower scores indicate burnout)
        "accomplished", "achievement", "achieved", "succeed", "success", "successful",
        "progress", "progressing", "moving forward", "making progress",
        "productive", "productivity", "getting things done", "completed",
        "finished", "done well", "did well", "performed well",
        
        # Competence and confidence
        "competent", "competence", "capable", "capability", "skilled", "skillful",
        "confident", "confidence", "able to", "can do", "good at",
        "effective", "effectiveness", "efficient", "efficiency",
        
        # Positive impact
        "making a difference", "making impact", "helping", "helped", "helpful",
        "valuable", "valuable contribution", "contributed", "contribution",
        "meaningful", "meaning", "purpose", "purposeful",
        
        # Growth and development
        "learning", "learned", "growing", "growth", "developing", "development",
        "improving", "improvement", "getting better", "better at",
        "mastered", "mastery", "expertise", "expert",
        
        # Satisfaction
        "satisfied", "satisfaction", "fulfilled", "fulfillment", "proud", "pride",
        "gratifying", "gratification", "rewarding", "reward",
        
        # # Negative indicators (inverted scoring)
        # "incompetent", "incompetence", "ineffective", "ineffectiveness",
        # "can't do", "unable to", "not good at", "poor performance",
        # "no progress", "not progressing", "stuck", "stagnant",
        # "no impact", "not making difference", "doesn't matter",
    ],
}

# Stress-related patterns (used for stress level detection)
STRESS_PATTERNS: List[str] = [
    "stressed", "stress", "stressing", "stressed out", "under stress",
    "pressure", "pressured", "pressuring", "under pressure",
    "anxious", "anxiety", "worried", "worry", "worrying",
    "tense", "tension", "strained", "straining",
    "overwhelmed", "overwhelming", "overloaded",
    "panic", "panicking", "panicked",
    "rushed", "rushing", "hurried", "hurrying",
    "deadline", "deadlines", "urgent", "urgency",
    "crisis", "crises", "emergency", "emergencies",
]

# Cynical thought patterns
CYNICAL_PATTERNS: List[str] = [
    "pointless", "meaningless", "doesn't matter", "doesn't make a difference",
    "waste of time", "waste of effort", "going through motions",
    "just a job", "just work", "it's just work",
    "don't care", "don't care anymore", "stopped caring",
    "lost interest", "no point", "what's the point",
    "cynical", "cynicism", "jaded", "disillusioned",
]

def get_terms_for_dimension(dimension: MBIDimension) -> List[str]:
    """Get all terms associated with a specific MBI dimension."""
    return MBI_TERMS.get(dimension, [])

def get_all_mbi_terms() -> List[str]:
    """Get all MBI-related terms across all dimensions."""
    all_terms = []
    for terms in MBI_TERMS.values():
        all_terms.extend(terms)
    return all_terms
