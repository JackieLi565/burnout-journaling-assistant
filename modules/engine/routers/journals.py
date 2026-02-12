"""Journal router endpoints."""
from fastapi import APIRouter, HTTPException, status
from typing import List
from models.journal import Journal, JournalCreate, JournalUpdate
from models.burnout import BurnoutRiskIndex, AnalysisRequest
from controllers.journal_controller import JournalController

router = APIRouter(prefix="/journals", tags=["journals"])

@router.post("/", response_model=Journal, status_code=status.HTTP_201_CREATED)
async def create_journal(journal: JournalCreate):
    """Create a new journal entry."""
    try:
        return JournalController.create_journal(journal)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.get("/", response_model=List[Journal])
async def get_all_journals():
    """Get all journals."""
    return JournalController.get_all_journals()

@router.get("/user/{user_id}", response_model=List[Journal])
async def get_journals_by_user(user_id: str):
    """Get all journals for a specific user."""
    return JournalController.get_journals_by_user(user_id)

@router.get("/{journal_id}", response_model=Journal)
async def get_journal(journal_id: str):
    """Get a journal by ID."""
    journal = JournalController.get_journal(journal_id)
    if not journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal with ID {journal_id} not found"
        )
    return journal

@router.put("/{journal_id}", response_model=Journal)
async def update_journal(journal_id: str, journal: JournalUpdate):
    """Update a journal entry."""
    updated_journal = JournalController.update_journal(journal_id, journal)
    if not updated_journal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal with ID {journal_id} not found"
        )
    return updated_journal

@router.delete("/{journal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_journal(journal_id: str):
    """Delete a journal entry."""
    deleted = JournalController.delete_journal(journal_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Journal with ID {journal_id} not found"
        )

@router.post("/analyze", response_model=BurnoutRiskIndex)
async def analyze_journal(request: AnalysisRequest):
    """
    Analyze a journal entry or text for burnout risk.
    
    If journal_id is provided, analyzes that journal entry.
    If text is provided, analyzes the text directly.
    """
    try:
        if request.journal_id:
            # Analyze existing journal entry
            result = JournalController.analyze_journal(request.journal_id)
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Journal with ID {request.journal_id} not found"
                )
            return result
        elif request.text:
            # Analyze provided text directly
            return JournalController.analyze_text(request.text)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either journal_id or text must be provided"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@router.post("/{journal_id}/analyze", response_model=BurnoutRiskIndex)
async def analyze_journal_by_id(journal_id: str):
    """Analyze a specific journal entry by ID for burnout risk."""
    try:
        result = JournalController.analyze_journal(journal_id)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Journal with ID {journal_id} not found"
            )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
