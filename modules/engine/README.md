# Burnout Journaling Assistant - Backend API

FastAPI backend for managing users and journal entries with Firebase Firestore.

## Features

- User management (CRUD operations)
- Journal management (CRUD operations)
- Firebase Firestore integration
- RESTful API endpoints
- Comprehensive test coverage

## Setup

### Prerequisites

- Python 3.9 or higher
- Node.js and npm (for Firebase CLI)
- Firebase CLI installed globally: `npm install -g firebase-tools`

### Installation

1. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```
# For local development with Firebase Emulator (default)
USE_EMULATOR=True
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_PROJECT_ID=demo-project

# For production (optional)
# USE_EMULATOR=False
# FIREBASE_CREDENTIALS_PATH=path/to/your/firebase-credentials.json
# FIREBASE_PROJECT_ID=your-firebase-project-id
```

4. Start the Firebase Local Emulator:

```bash
# Option 1: Using npm script (from project root)
npm run firebase:emulator

# Option 2: Using provided scripts
# On Linux/Mac:
./scripts/start-firebase-emulator.sh

# On Windows (PowerShell):
.\scripts\start-firebase-emulator.ps1

# Option 3: Manual command
firebase emulators:start --only firestore
```

The emulator will start on:

- Firestore: `localhost:8080`
- Emulator UI: `http://localhost:4000`

## Running the Server

### Development Mode

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Alternative docs: http://localhost:8000/redoc

## API Endpoints

### Users

- `POST /api/v1/users/` - Create a new user
- `GET /api/v1/users/` - Get all users
- `GET /api/v1/users/{user_id}` - Get a user by ID
- `PUT /api/v1/users/{user_id}` - Update a user
- `DELETE /api/v1/users/{user_id}` - Delete a user

### Journals

- `POST /api/v1/journals/` - Create a new journal entry
- `GET /api/v1/journals/` - Get all journals
- `GET /api/v1/journals/user/{user_id}` - Get all journals for a user
- `GET /api/v1/journals/{journal_id}` - Get a journal by ID
- `PUT /api/v1/journals/{journal_id}` - Update a journal entry
- `DELETE /api/v1/journals/{journal_id}` - Delete a journal entry

## Running Tests

```bash
pytest
```

Run with coverage:

```bash
pytest --cov=. --cov-report=html
```

## Project Structure

```
engine/
├── main.py                 # FastAPI application entry point
├── config.py               # Configuration settings
├── database.py             # Firebase Firestore connection
├── models/                 # Pydantic models
│   ├── user.py
│   └── journal.py
├── controllers/            # Business logic
│   ├── user_controller.py
│   └── journal_controller.py
├── routers/                # API route handlers
│   ├── users.py
│   └── journals.py
└── tests/                  # Test files
    ├── test_users.py
    └── test_journals.py
```

## Environment Variables

- `USE_EMULATOR` - Use Firebase Local Emulator (default: True)
- `FIRESTORE_EMULATOR_HOST` - Emulator host and port (default: localhost:8080)
- `FIREBASE_PROJECT_ID` - Firebase project ID (default: demo-project)
- `FIREBASE_CREDENTIALS_PATH` - Path to Firebase service account JSON file (for production)
- `USE_MOCK_DB` - Use in-memory mock database for tests (default: False, set to True automatically in tests)
- `HOST` - Server host (default: 0.0.0.0)
- `PORT` - Server port (default: 8000)
- `DEBUG` - Debug mode (default: True)

## Firebase Local Emulator

The project uses Firebase Local Emulator for development. This allows you to develop and test without connecting to a real Firebase project.

### Starting the Emulator

Use the provided scripts:

- **Linux/Mac**: `./scripts/start-firebase-emulator.sh`
- **Windows**: `.\scripts\start-firebase-emulator.ps1`

Or run directly:

```bash
firebase emulators:start --only firestore
```

## Tooling

Gemini Live API: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/live-api
-Live burnout check-ins: Ask users questions by voice/text and get immediate contextual responses.
-Natural journaling assistant: Create a “smart journal buddy” that helps users reflect on their day and surface emotional insights interactively.
-Live mood extraction + tools: Combine with function calling so when the user says “I feel overwhelmed with work stress,” our app saves that sentiment and triggers analytics updates in real time.

LangExtract: https://developers.googleblog.com/introducing-langextract-a-gemini-powered-information-extraction-library/
-Emotion & cause tagging: Turn natural journal text into structured sentiment tags (e.g., “frustrated at work” → {emotion: “frustration”, cause: “work”}).
-Trend extraction: Pull out regular patterns like recurring stress events or self-reported sleep hours.
-Dashboard data: Feed structured JSON outputs into analytics (e.g., daily/monthly burnout score trends).
