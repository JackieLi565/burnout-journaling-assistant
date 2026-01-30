"""Tests for journal endpoints and controllers."""
import pytest
from fastapi.testclient import TestClient
from main import app
from models.journal import JournalCreate, JournalUpdate
from models.user import UserCreate
from controllers.journal_controller import JournalController
from controllers.user_controller import UserController

client = TestClient(app)

class TestJournalController:
    """Test journal controller methods."""
    
    @pytest.fixture
    def test_user(self):
        """Create a test user for journal tests."""
        user_data = UserCreate(
            email="journaltest@example.com",
            name="Journal Test User"
        )
        user = UserController.create_user(user_data)
        yield user
        # Cleanup
        UserController.delete_user(user.id)
    
    def test_create_journal(self, test_user):
        """Test creating a journal."""
        journal_data = JournalCreate(
            user_id=test_user.id,
            title="Test Journal",
            content="This is a test journal entry."
        )
        journal = JournalController.create_journal(journal_data)
        
        assert journal.title == "Test Journal"
        assert journal.content == "This is a test journal entry."
        assert journal.user_id == test_user.id
        assert journal.id is not None
        
        # Cleanup
        JournalController.delete_journal(journal.id)
    
    def test_create_journal_nonexistent_user(self):
        """Test creating a journal with nonexistent user."""
        journal_data = JournalCreate(
            user_id="nonexistent_user_id",
            title="Test Journal",
            content="This should fail."
        )
        
        with pytest.raises(ValueError):
            JournalController.create_journal(journal_data)
    
    def test_get_journal(self, test_user):
        """Test getting a journal by ID."""
        journal_data = JournalCreate(
            user_id=test_user.id,
            title="Get Test Journal",
            content="Content for get test."
        )
        created_journal = JournalController.create_journal(journal_data)
        
        retrieved_journal = JournalController.get_journal(created_journal.id)
        
        assert retrieved_journal is not None
        assert retrieved_journal.id == created_journal.id
        assert retrieved_journal.title == created_journal.title
        
        # Cleanup
        JournalController.delete_journal(created_journal.id)
    
    def test_get_journals_by_user(self, test_user):
        """Test getting all journals for a user."""
        # Create multiple journals
        journal1_data = JournalCreate(
            user_id=test_user.id,
            title="Journal 1",
            content="Content 1"
        )
        journal2_data = JournalCreate(
            user_id=test_user.id,
            title="Journal 2",
            content="Content 2"
        )
        
        journal1 = JournalController.create_journal(journal1_data)
        journal2 = JournalController.create_journal(journal2_data)
        
        journals = JournalController.get_journals_by_user(test_user.id)
        
        assert len(journals) >= 2
        journal_ids = [j.id for j in journals]
        assert journal1.id in journal_ids
        assert journal2.id in journal_ids
        
        # Cleanup
        JournalController.delete_journal(journal1.id)
        JournalController.delete_journal(journal2.id)
    
    def test_update_journal(self, test_user):
        """Test updating a journal."""
        journal_data = JournalCreate(
            user_id=test_user.id,
            title="Update Test Journal",
            content="Original content"
        )
        created_journal = JournalController.create_journal(journal_data)
        
        update_data = JournalUpdate(title="Updated Title")
        updated_journal = JournalController.update_journal(created_journal.id, update_data)
        
        assert updated_journal is not None
        assert updated_journal.title == "Updated Title"
        assert updated_journal.content == created_journal.content
        
        # Cleanup
        JournalController.delete_journal(created_journal.id)
    
    def test_delete_journal(self, test_user):
        """Test deleting a journal."""
        journal_data = JournalCreate(
            user_id=test_user.id,
            title="Delete Test Journal",
            content="Content to delete"
        )
        created_journal = JournalController.create_journal(journal_data)
        
        deleted = JournalController.delete_journal(created_journal.id)
        assert deleted is True
        
        # Verify journal is deleted
        journal = JournalController.get_journal(created_journal.id)
        assert journal is None

class TestJournalEndpoints:
    """Test journal API endpoints."""
    
    @pytest.fixture
    def test_user_id(self):
        """Create a test user and return its ID."""
        user_data = {
            "email": "journalendpoint@example.com",
            "name": "Journal Endpoint Test User"
        }
        response = client.post("/api/v1/users/", json=user_data)
        user_id = response.json()["id"]
        yield user_id
        # Cleanup
        client.delete(f"/api/v1/users/{user_id}")
    
    def test_create_journal_endpoint(self, test_user_id):
        """Test POST /api/v1/journals endpoint."""
        journal_data = {
            "user_id": test_user_id,
            "title": "Endpoint Test Journal",
            "content": "This is a test journal entry from endpoint."
        }
        response = client.post("/api/v1/journals/", json=journal_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == journal_data["title"]
        assert data["content"] == journal_data["content"]
        assert data["user_id"] == test_user_id
        
        # Cleanup
        journal_id = data["id"]
        client.delete(f"/api/v1/journals/{journal_id}")
    
    def test_create_journal_nonexistent_user(self):
        """Test POST /api/v1/journals with nonexistent user."""
        journal_data = {
            "user_id": "nonexistent_user_id",
            "title": "Test Journal",
            "content": "This should fail."
        }
        response = client.post("/api/v1/journals/", json=journal_data)
        assert response.status_code == 400
    
    def test_get_journal_endpoint(self, test_user_id):
        """Test GET /api/v1/journals/{journal_id} endpoint."""
        # Create a journal first
        journal_data = {
            "user_id": test_user_id,
            "title": "Get Endpoint Test",
            "content": "Content for get endpoint test"
        }
        create_response = client.post("/api/v1/journals/", json=journal_data)
        journal_id = create_response.json()["id"]
        
        # Get the journal
        response = client.get(f"/api/v1/journals/{journal_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == journal_id
        assert data["title"] == journal_data["title"]
        
        # Cleanup
        client.delete(f"/api/v1/journals/{journal_id}")
    
    def test_get_journals_by_user_endpoint(self, test_user_id):
        """Test GET /api/v1/journals/user/{user_id} endpoint."""
        # Create multiple journals
        journal1_data = {
            "user_id": test_user_id,
            "title": "Journal 1",
            "content": "Content 1"
        }
        journal2_data = {
            "user_id": test_user_id,
            "title": "Journal 2",
            "content": "Content 2"
        }
        
        create1_response = client.post("/api/v1/journals/", json=journal1_data)
        create2_response = client.post("/api/v1/journals/", json=journal2_data)
        journal1_id = create1_response.json()["id"]
        journal2_id = create2_response.json()["id"]
        
        # Get journals by user
        response = client.get(f"/api/v1/journals/user/{test_user_id}")
        
        assert response.status_code == 200
        journals = response.json()
        assert isinstance(journals, list)
        assert len(journals) >= 2
        
        # Cleanup
        client.delete(f"/api/v1/journals/{journal1_id}")
        client.delete(f"/api/v1/journals/{journal2_id}")
    
    def test_update_journal_endpoint(self, test_user_id):
        """Test PUT /api/v1/journals/{journal_id} endpoint."""
        # Create a journal first
        journal_data = {
            "user_id": test_user_id,
            "title": "Update Endpoint Test",
            "content": "Original content"
        }
        create_response = client.post("/api/v1/journals/", json=journal_data)
        journal_id = create_response.json()["id"]
        
        # Update the journal
        update_data = {"title": "Updated Title"}
        response = client.put(f"/api/v1/journals/{journal_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Title"
        
        # Cleanup
        client.delete(f"/api/v1/journals/{journal_id}")
    
    def test_delete_journal_endpoint(self, test_user_id):
        """Test DELETE /api/v1/journals/{journal_id} endpoint."""
        # Create a journal first
        journal_data = {
            "user_id": test_user_id,
            "title": "Delete Endpoint Test",
            "content": "Content to delete"
        }
        create_response = client.post("/api/v1/journals/", json=journal_data)
        journal_id = create_response.json()["id"]
        
        # Delete the journal
        response = client.delete(f"/api/v1/journals/{journal_id}")
        assert response.status_code == 204
        
        # Verify journal is deleted
        get_response = client.get(f"/api/v1/journals/{journal_id}")
        assert get_response.status_code == 404
