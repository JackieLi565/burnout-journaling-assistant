"""User data models."""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr
    name: str

class UserCreate(UserBase):
    """User creation model."""
    pass

class UserUpdate(BaseModel):
    """User update model."""
    email: Optional[EmailStr] = None
    name: Optional[str] = None

class User(UserBase):
    """User response model."""
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
