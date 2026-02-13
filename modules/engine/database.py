"""Firebase Firestore database connection and utilities."""
import os
import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path
from config import settings

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with credentials or emulator."""
    if not firebase_admin._apps:
        if settings.USE_EMULATOR:
            # Use Firebase Emulator
            os.environ["FIRESTORE_EMULATOR_HOST"] = settings.FIRESTORE_EMULATOR_HOST
            cred = credentials.Certificate("C:/Users/Jonah/Documents/_Schoolwork/University/COE70AB/Application/burnout-journaling-assistant/capstone-64f78-firebase-adminsdk-fbsvc-22f94137ca.json")#gotta use some actual credentials here foir the emulator idek why
            # Initialize with default credentials for emulator
            firebase_admin.initialize_app(
                cred,
                {'projectId': settings.FIREBASE_PROJECT_ID}
            )
        else:
            # Use production Firebase
            if settings.FIREBASE_CREDENTIALS_PATH:
                cred_path = Path(settings.FIREBASE_CREDENTIALS_PATH)
                if cred_path.exists():
                    cred = credentials.Certificate(str(cred_path))
                    firebase_admin.initialize_app(cred, {
                        'projectId': settings.FIREBASE_PROJECT_ID
                    })
                else:
                    raise FileNotFoundError(
                        f"Firebase credentials file not found at {settings.FIREBASE_CREDENTIALS_PATH}"
                    )
            else:
                # Try to use default credentials (for GCP environments)
                firebase_admin.initialize_app()
    
    return firestore.client()

# Initialize database connection
db = initialize_firebase()

# Collection names
USERS_COLLECTION = "users"
JOURNALS_COLLECTION = "journals"
