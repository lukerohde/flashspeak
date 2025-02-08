import pytest
from django.urls import reverse
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