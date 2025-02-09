from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import FlashCardViewSet

router = DefaultRouter()
router.register(r'flashcards', FlashCardViewSet, basename='flashcard')

urlpatterns = [
    path('', include(router.urls)),
]
