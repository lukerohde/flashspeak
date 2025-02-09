from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from flashcards.models import FlashCard

@login_required(login_url='/accounts/login/')
def voice_chat_view(request):
    flashcards = FlashCard.objects.filter(user=request.user)
    return render(request, 'voice_chat/index.html', {'flashcards': flashcards})
