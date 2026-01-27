"""Journal data models."""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JournalBase(BaseModel):
    """Base journal model with common fields."""
    title: str
    content: str

class JournalCreate(JournalBase):
    """Journal creation model."""
    user_id: str

class JournalUpdate(BaseModel):
    """Journal update model."""
    title: Optional[str] = None
    content: Optional[str] = None

class Journal(JournalBase):
    """Journal response model."""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
