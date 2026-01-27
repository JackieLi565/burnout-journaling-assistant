"""User controller with business logic."""
from typing import List, Optional
from datetime import datetime
from firebase_admin import firestore
from database import db, USERS_COLLECTION
from models.user import User, UserCreate, UserUpdate

class UserController:
    """Controller for user operations."""
    
    @staticmethod
    def create_user(user_data: UserCreate) -> User:
        """Create a new user in Firestore."""
        user_ref = db.collection(USERS_COLLECTION).document()
        
        # Check if email already exists
        existing_users = db.collection(USERS_COLLECTION).where("email", "==", user_data.email).limit(1).get()
        if existing_users:
            raise ValueError(f"User with email {user_data.email} already exists")
        
        now = datetime.utcnow()
        user_dict = {
            "email": user_data.email,
            "name": user_data.name,
            "created_at": now,
            "updated_at": now
        }
        
        user_ref.set(user_dict)
        
        return User(
            id=user_ref.id,
            email=user_dict["email"],
            name=user_dict["name"],
            created_at=user_dict["created_at"],
            updated_at=user_dict["updated_at"]
        )
    
    @staticmethod
    def get_user(user_id: str) -> Optional[User]:
        """Get a user by ID."""
        user_doc = db.collection(USERS_COLLECTION).document(user_id).get()
        
        if not user_doc.exists:
            return None
        
        user_data = user_doc.to_dict()
        return User(
            id=user_doc.id,
            email=user_data["email"],
            name=user_data["name"],
            created_at=user_data["created_at"],
            updated_at=user_data["updated_at"]
        )
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[User]:
        """Get a user by email."""
        users = db.collection(USERS_COLLECTION).where("email", "==", email).limit(1).get()
        
        if not users:
            return None
        
        user_doc = users[0]
        user_data = user_doc.to_dict()
        return User(
            id=user_doc.id,
            email=user_data["email"],
            name=user_data["name"],
            created_at=user_data["created_at"],
            updated_at=user_data["updated_at"]
        )
    
    @staticmethod
    def get_all_users() -> List[User]:
        """Get all users."""
        users_ref = db.collection(USERS_COLLECTION).stream()
        
        users = []
        for user_doc in users_ref:
            user_data = user_doc.to_dict()
            users.append(User(
                id=user_doc.id,
                email=user_data["email"],
                name=user_data["name"],
                created_at=user_data["created_at"],
                updated_at=user_data["updated_at"]
            ))
        
        return users
    
    @staticmethod
    def update_user(user_id: str, user_data: UserUpdate) -> Optional[User]:
        """Update a user."""
        user_ref = db.collection(USERS_COLLECTION).document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return None
        
        update_data = {}
        if user_data.email is not None:
            # Check if email already exists for another user
            existing_users = db.collection(USERS_COLLECTION).where("email", "==", user_data.email).get()
            for existing_user in existing_users:
                if existing_user.id != user_id:
                    raise ValueError(f"User with email {user_data.email} already exists")
            update_data["email"] = user_data.email
        
        if user_data.name is not None:
            update_data["name"] = user_data.name
        
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            user_ref.update(update_data)
        
        # Return updated user
        updated_doc = user_ref.get()
        updated_data = updated_doc.to_dict()
        return User(
            id=updated_doc.id,
            email=updated_data["email"],
            name=updated_data["name"],
            created_at=updated_data["created_at"],
            updated_at=updated_data["updated_at"]
        )
    
    @staticmethod
    def delete_user(user_id: str) -> bool:
        """Delete a user."""
        user_ref = db.collection(USERS_COLLECTION).document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            return False
        
        user_ref.delete()
        return True
