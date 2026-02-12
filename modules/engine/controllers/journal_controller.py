"""Journal controller with business logic."""
from typing import List, Optional
from datetime import datetime
from firebase_admin import firestore
from database import db, JOURNALS_COLLECTION, USERS_COLLECTION
from models.journal import Journal, JournalCreate, JournalUpdate
from models.burnout import BurnoutRiskIndex
from services.burnout_analysis import BurnoutAnalysisService
from config import settings

class JournalController:
    """Controller for journal operations."""
    
    @staticmethod
    def create_journal(journal_data: JournalCreate) -> Journal:
        """Create a new journal entry in Firestore."""
        # Verify user exists
        user_ref = db.collection(USERS_COLLECTION).document(journal_data.user_id)
        if not user_ref.get().exists:
            raise ValueError(f"User with ID {journal_data.user_id} does not exist")
        
        journal_ref = db.collection(JOURNALS_COLLECTION).document()
        now = datetime.utcnow()
        
        journal_dict = {
            "user_id": journal_data.user_id,
            "title": journal_data.title,
            "content": journal_data.content,
            "created_at": now,
            "updated_at": now
        }
        
        journal_ref.set(journal_dict)
        
        return Journal(
            id=journal_ref.id,
            user_id=journal_dict["user_id"],
            title=journal_dict["title"],
            content=journal_dict["content"],
            created_at=journal_dict["created_at"],
            updated_at=journal_dict["updated_at"]
        )
    
    @staticmethod
    def get_journal(journal_id: str) -> Optional[Journal]:
        """Get a journal by ID."""
        journal_doc = db.collection(JOURNALS_COLLECTION).document(journal_id).get()
        
        if not journal_doc.exists:
            return None
        
        journal_data = journal_doc.to_dict()
        return Journal(
            id=journal_doc.id,
            user_id=journal_data["user_id"],
            title=journal_data["title"],
            content=journal_data["content"],
            created_at=journal_data["created_at"],
            updated_at=journal_data["updated_at"]
        )
    
    @staticmethod
    def get_journals_by_user(user_id: str) -> List[Journal]:
        """Get all journals for a specific user."""
        journals_ref = db.collection(JOURNALS_COLLECTION).where("user_id", "==", user_id).order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        
        journals = []
        for journal_doc in journals_ref:
            journal_data = journal_doc.to_dict()
            journals.append(Journal(
                id=journal_doc.id,
                user_id=journal_data["user_id"],
                title=journal_data["title"],
                content=journal_data["content"],
                created_at=journal_data["created_at"],
                updated_at=journal_data["updated_at"]
            ))
        
        return journals
    
    @staticmethod
    def get_all_journals() -> List[Journal]:
        """Get all journals."""
        journals_ref = db.collection(JOURNALS_COLLECTION).order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        
        journals = []
        for journal_doc in journals_ref:
            journal_data = journal_doc.to_dict()
            journals.append(Journal(
                id=journal_doc.id,
                user_id=journal_data["user_id"],
                title=journal_data["title"],
                content=journal_data["content"],
                created_at=journal_data["created_at"],
                updated_at=journal_data["updated_at"]
            ))
        
        return journals
    
    @staticmethod
    def update_journal(journal_id: str, journal_data: JournalUpdate) -> Optional[Journal]:
        """Update a journal entry."""
        journal_ref = db.collection(JOURNALS_COLLECTION).document(journal_id)
        journal_doc = journal_ref.get()
        
        if not journal_doc.exists:
            return None
        
        update_data = {}
        if journal_data.title is not None:
            update_data["title"] = journal_data.title
        
        if journal_data.content is not None:
            update_data["content"] = journal_data.content
        
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            journal_ref.update(update_data)
        
        # Return updated journal
        updated_doc = journal_ref.get()
        updated_data = updated_doc.to_dict()
        return Journal(
            id=updated_doc.id,
            user_id=updated_data["user_id"],
            title=updated_data["title"],
            content=updated_data["content"],
            created_at=updated_data["created_at"],
            updated_at=updated_data["updated_at"]
        )
    
    @staticmethod
    def delete_journal(journal_id: str) -> bool:
        """Delete a journal entry."""
        journal_ref = db.collection(JOURNALS_COLLECTION).document(journal_id)
        journal_doc = journal_ref.get()
        
        if not journal_doc.exists:
            return False
        
        journal_ref.delete()
        return True
    
    @staticmethod
    def analyze_journal(journal_id: str) -> Optional[BurnoutRiskIndex]:
        """
        Analyze a journal entry for burnout risk.
        
        Args:
            journal_id: ID of the journal entry to analyze
        
        Returns:
            BurnoutRiskIndex with analysis results, or None if journal not found
        """
        journal = JournalController.get_journal(journal_id)
        if not journal:
            return None
        
        # Initialize analysis service
        analysis_service = BurnoutAnalysisService(api_key=settings.GEMINI_API_KEY) #use your own gemini api key if u need to
        
        # Combine title and content for analysis
        text_to_analyze = f"{journal.title}\n{journal.content}"
        
        # Perform analysis
        result = analysis_service.analyze(text_to_analyze)
        
        # Update journal entry with analysis results (optional)
        journal_ref = db.collection(JOURNALS_COLLECTION).document(journal_id)
        journal_ref.update({
            "burnout_analysis": {
                "overall_score": result.overall_score,
                "risk_level": result.risk_level,
                "emotional_exhaustion": result.emotional_exhaustion.normalized_score,
                "depersonalization": result.depersonalization.normalized_score,
                "personal_accomplishment": result.personal_accomplishment.normalized_score,
                "analyzed_at": datetime.utcnow()
            },
            "updated_at": datetime.utcnow()
        })
        
        return result
    
    @staticmethod
    def analyze_text(text: str) -> BurnoutRiskIndex:
        """
        Analyze raw text for burnout risk.
        
        Args:
            text: Text to analyze
        
        Returns:
            BurnoutRiskIndex with analysis results
        """
        # Initialize analysis service
        analysis_service = BurnoutAnalysisService(api_key=settings.GEMINI_API_KEY) #use your own gemini api key if u need to
        
        # Perform analysis
        return analysis_service.analyze(text)
