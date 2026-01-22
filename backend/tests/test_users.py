"""Tests for user endpoints and controllers."""
import pytest
from fastapi.testclient import TestClient
from main import app
from models.user import UserCreate, UserUpdate
from controllers.user_controller import UserController

client = TestClient(app)

class TestUserController:
    """Test user controller methods."""
    
    def test_create_user(self):
        """Test creating a user."""
        user_data = UserCreate(
            email="test@example.com",
            name="Test User"
        )
        user = UserController.create_user(user_data)
        
        assert user.email == "test@example.com"
        assert user.name == "Test User"
        assert user.id is not None
        
        # Cleanup
        UserController.delete_user(user.id)
    
    def test_create_duplicate_user(self):
        """Test creating a user with duplicate email."""
        user_data = UserCreate(
            email="duplicate@example.com",
            name="Test User"
        )
        user = UserController.create_user(user_data)
        
        # Try to create another user with same email
        with pytest.raises(ValueError):
            UserController.create_user(user_data)
        
        # Cleanup
        UserController.delete_user(user.id)
    
    def test_get_user(self):
        """Test getting a user by ID."""
        user_data = UserCreate(
            email="gettest@example.com",
            name="Get Test User"
        )
        created_user = UserController.create_user(user_data)
        
        retrieved_user = UserController.get_user(created_user.id)
        
        assert retrieved_user is not None
        assert retrieved_user.id == created_user.id
        assert retrieved_user.email == created_user.email
        
        # Cleanup
        UserController.delete_user(created_user.id)
    
    def test_get_nonexistent_user(self):
        """Test getting a user that doesn't exist."""
        user = UserController.get_user("nonexistent_id")
        assert user is None
    
    def test_update_user(self):
        """Test updating a user."""
        user_data = UserCreate(
            email="updatetest@example.com",
            name="Update Test User"
        )
        created_user = UserController.create_user(user_data)
        
        update_data = UserUpdate(name="Updated Name")
        updated_user = UserController.update_user(created_user.id, update_data)
        
        assert updated_user is not None
        assert updated_user.name == "Updated Name"
        assert updated_user.email == created_user.email
        
        # Cleanup
        UserController.delete_user(created_user.id)
    
    def test_delete_user(self):
        """Test deleting a user."""
        user_data = UserCreate(
            email="deletetest@example.com",
            name="Delete Test User"
        )
        created_user = UserController.create_user(user_data)
        
        deleted = UserController.delete_user(created_user.id)
        assert deleted is True
        
        # Verify user is deleted
        user = UserController.get_user(created_user.id)
        assert user is None

class TestUserEndpoints:
    """Test user API endpoints."""
    
    def test_create_user_endpoint(self):
        """Test POST /api/v1/users endpoint."""
        user_data = {
            "email": "endpoint@example.com",
            "name": "Endpoint Test User"
        }
        response = client.post("/api/v1/users/", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == user_data["email"]
        assert data["name"] == user_data["name"]
        
        # Cleanup
        user_id = data["id"]
        client.delete(f"/api/v1/users/{user_id}")
    
    def test_get_user_endpoint(self):
        """Test GET /api/v1/users/{user_id} endpoint."""
        # Create a user first
        user_data = {
            "email": "getendpoint@example.com",
            "name": "Get Endpoint Test"
        }
        create_response = client.post("/api/v1/users/", json=user_data)
        user_id = create_response.json()["id"]
        
        # Get the user
        response = client.get(f"/api/v1/users/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == user_data["email"]
        
        # Cleanup
        client.delete(f"/api/v1/users/{user_id}")
    
    def test_get_nonexistent_user_endpoint(self):
        """Test GET /api/v1/users/{user_id} with nonexistent user."""
        response = client.get("/api/v1/users/nonexistent_id")
        assert response.status_code == 404
    
    def test_get_all_users_endpoint(self):
        """Test GET /api/v1/users endpoint."""
        response = client.get("/api/v1/users/")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
    
    def test_update_user_endpoint(self):
        """Test PUT /api/v1/users/{user_id} endpoint."""
        # Create a user first
        user_data = {
            "email": "updateendpoint@example.com",
            "name": "Update Endpoint Test"
        }
        create_response = client.post("/api/v1/users/", json=user_data)
        user_id = create_response.json()["id"]
        
        # Update the user
        update_data = {"name": "Updated Name"}
        response = client.put(f"/api/v1/users/{user_id}", json=update_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        
        # Cleanup
        client.delete(f"/api/v1/users/{user_id}")
    
    def test_delete_user_endpoint(self):
        """Test DELETE /api/v1/users/{user_id} endpoint."""
        # Create a user first
        user_data = {
            "email": "deleteendpoint@example.com",
            "name": "Delete Endpoint Test"
        }
        create_response = client.post("/api/v1/users/", json=user_data)
        user_id = create_response.json()["id"]
        
        # Delete the user
        response = client.delete(f"/api/v1/users/{user_id}")
        assert response.status_code == 204
        
        # Verify user is deleted
        get_response = client.get(f"/api/v1/users/{user_id}")
        assert get_response.status_code == 404
