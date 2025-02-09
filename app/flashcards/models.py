from django.db import models
from django.contrib.auth.models import User
from uuid import uuid4

class FlashCard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4, editable=False)
    front = models.TextField()
    back = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    tags = models.JSONField(default=list)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='flashcards')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"FlashCard {self.id}: {self.front[:30]}..."
