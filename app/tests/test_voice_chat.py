import pytest
import requests
from django.urls import reverse
from unittest.mock import patch
from rest_framework import status
from .test_base import BaseTestCase
from .factories import UserFactory
from bs4 import BeautifulSoup


pytestmark = pytest.mark.django_db

class VoiceChatViewTests(BaseTestCase):
    """Test voice chat view functionality"""
    
    @pytest.fixture(autouse=True)
    def voice_chat_setup(self):
        """Set up voice chat specific test data"""
        self.voice_chat_url = reverse('voice_chat:index')
        self.user = self.create_and_login_user()
        
    
    def test_voice_chat_view_requires_login(self):
        """Test that voice chat view requires authentication"""
        # Logout for this test
        self.client.logout()
        
        # Test unauthenticated access
        response = self.client.get(self.voice_chat_url)
        self.assertRedirects(response, f'/accounts/login/?next={self.voice_chat_url}')
        
        # Test authenticated access
        self.login_user(self.user)
        response = self.client.get(self.voice_chat_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'voice_chat/index.html')
    
    def test_voice_chat_page_contains_required_components(self):
        """Test that the voice chat page contains all required components"""
        self.login_user(self.user)

        response = self.client.get(self.voice_chat_url)
        content = response.content.decode()

        # Use BeautifulSoup for more robust parsing
        soup = BeautifulSoup(content, "html.parser")

        # Use BeautifulSoup to check if elements exist more flexibly
        assert soup.find("div", id="transcript-container") is not None
        assert soup.find("div", id="microphone-controls") is not None
        assert soup.find("div", id="sidebar") is not None
        assert soup.find("select", {"id": "micSelect"}) is not None
        assert soup.find("button", {"data-voice-target": "toggleMic"}) is not None
        assert soup.find("button", {"data-voice-target": "pushToTalk"}) is not None

        # Check for required static files in raw text
        assert 'voice_chat/css/index.css' in content
        assert 'bootstrap' in content.lower()
        assert 'stimulus' in content.lower()


class SessionAPIViewTests(BaseTestCase):
    """Test session API endpoint functionality"""
    
    @pytest.fixture(autouse=True)
    def session_api_setup(self):
        """Set up session API specific test data"""
        self.session_url = reverse('voice_chat:session')
        self.user = self.create_and_login_user()
        
        # Mock response data
        self.mock_client_secret = "test_secret_123"
        self.mock_response_data = {
            "client_secret": {
                "value": self.mock_client_secret
            }
        }
    
    def test_session_api_requires_login(self):
        """Test that session API requires authentication"""
        # Logout for this test
        self.client.logout()
        
        # Test unauthenticated access
        response = self.client.get(self.session_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Test authenticated access (without mocking OpenAI call yet)
        self.login_user(self.user)
        with patch('requests.post') as mock_post:
            mock_post.return_value.json.return_value = self.mock_response_data
            mock_post.return_value.raise_for_status.return_value = None
            response = self.client.get(self.session_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    @patch('requests.post')
    def test_successful_session_creation(self, mock_post):
        """Test successful creation of a session"""
        self.login_user(self.user)
        
        # Mock the successful OpenAI API response
        mock_post.return_value.json.return_value = self.mock_response_data
        mock_post.return_value.raise_for_status.return_value = None
        
        response = self.client.get(self.session_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"client_secret": self.mock_client_secret})
        
        # Verify the OpenAI API was called with correct data
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        self.assertEqual(call_args[0][0], 'https://api.openai.com/v1/realtime/sessions')
        
        # Verify request payload
        request_data = call_args[1]['json']
        self.assertEqual(request_data['model'], 'gpt-4o-mini-realtime-preview-2024-12-17')
        self.assertEqual(request_data['modalities'], ['text', 'audio'])
        self.assertEqual(request_data['voice'], 'ballad')
        
    @patch('requests.post')
    def test_session_creation_failure(self, mock_post):
        """Test handling of session creation failure"""
        self.login_user(self.user)
        
        # Mock a failed OpenAI API response
        mock_post.return_value.raise_for_status.side_effect = requests.exceptions.RequestException(
            response=type('Response', (), {'status_code': 500, 'json': lambda: {"error": "API Error"}})
        )
        
        response = self.client.get(self.session_url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.json(), {"error": "API Error"})