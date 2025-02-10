from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from flashcards.models import FlashCard

from django.db import models

@login_required(login_url='/accounts/login/')
def voice_chat_view(request):
    # Get flashcards sorted by most recent review
    flashcards = FlashCard.objects.filter(user=request.user).order_by(
        models.F('front_last_review').desc(nulls_last=True),
        models.F('back_last_review').desc(nulls_last=True),
        '-created_at'
    )
    return render(request, 'voice_chat/index.html', {'flashcards': flashcards})
