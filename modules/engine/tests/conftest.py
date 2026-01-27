"""Pytest configuration and fixtures."""
import pytest
import os
from pathlib import Path

# Set test environment variables
os.environ.setdefault("FIREBASE_CREDENTIALS_PATH", "")
os.environ.setdefault("FIREBASE_PROJECT_ID", "test-project")
os.environ.setdefault("DEBUG", "True")
