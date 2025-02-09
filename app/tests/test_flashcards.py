import pytest
from django.urls import reverse
from rest_framework import status
from .test_base import BaseTestCase
from .factories import UserFactory, FlashCardFactory
from flashcards.models import FlashCard

pytestmark = pytest.mark.django_db

class TestFlashCardAPI(BaseTestCase):
    """Test the FlashCard API endpoints."""

    def setUp(self):
        super().setUp()
        self.user = self.create_and_login_user()
        self.other_user = UserFactory()
        self.flash_card = FlashCardFactory(user=self.user)
        self.other_user_card = FlashCardFactory(user=self.other_user)
        self.list_url = reverse('flashcard-list')
        self.detail_url = reverse('flashcard-detail', kwargs={'pk': self.flash_card.id})

    def test_bulk_create_flashcards(self):
        """Test creating multiple flash cards in one request."""
        data = [
            {
                'front': 'Front 1',
                'back': 'Back 1',
                'tags': ['test1']
            },
            {
                'front': 'Front 2',
                'back': 'Back 2',
                'tags': ['test2']
            }
        ]
        response = self.client.post(self.list_url, data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(FlashCard.objects.count(), 4)  # Including setup cards
        self.assertEqual(response.data[0]['front'], 'Front 1')
        self.assertEqual(response.data[1]['front'], 'Front 2')

    def test_create_flashcard(self):
        """Test creating a new flash card."""
        data = {
            'front': 'Test front',
            'back': 'Test back',
            'tags': ['test', 'new']
        }
        response = self.client.post(self.list_url, data, content_type='application/json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FlashCard.objects.count(), 3)  # Including setup cards
        self.assertEqual(response.data['front'], 'Test front')
        self.assertEqual(response.data['back'], 'Test back')
        self.assertEqual(response.data['tags'], ['test', 'new'])

    def test_list_flashcards(self):
        """Test listing flash cards."""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)  # Should only see own cards
        self.assertEqual(response.data[0]['id'], str(self.flash_card.id))

    def test_get_flashcard_detail(self):
        """Test getting a specific flash card."""
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(self.flash_card.id))

    def test_update_flashcard(self):
        """Test updating a flash card."""
        data = {
            'front': 'Updated front',
            'back': 'Updated back',
            'tags': ['updated']
        }
        response = self.client.put(
            self.detail_url, 
            data,
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.flash_card.refresh_from_db()
        self.assertEqual(self.flash_card.front, 'Updated front')
        self.assertEqual(self.flash_card.back, 'Updated back')
        self.assertEqual(self.flash_card.tags, ['updated'])

    def test_delete_flashcard(self):
        """Test deleting a flash card."""
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(FlashCard.objects.filter(id=self.flash_card.id).count(), 0)

    def test_cannot_access_other_users_cards(self):
        """Test that users cannot access other users' cards."""
        other_card_url = reverse('flashcard-detail', kwargs={'pk': self.other_user_card.id})
        response = self.client.get(other_card_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access the API."""
        self.client.logout()
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TestFlashCardModel(BaseTestCase):
    """Test the FlashCard model."""

    def test_flashcard_creation(self):
        """Test creating a flash card."""
        flash_card = FlashCardFactory()
        self.assertIsNotNone(flash_card.id)
        self.assertTrue(flash_card.created_at)
        self.assertTrue(flash_card.updated_at)

    def test_flashcard_str_representation(self):
        """Test the string representation of a flash card."""
        flash_card = FlashCardFactory(front="Test front content")
        self.assertIn("Test front content", str(flash_card))

    def test_flashcard_ordering(self):
        """Test that flash cards are ordered by created_at in descending order."""
        FlashCardFactory.create_batch(3)
        cards = FlashCard.objects.all()
        self.assertTrue(all(
            cards[i].created_at >= cards[i+1].created_at 
            for i in range(len(cards)-1)
        ))
