from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from django.template.loader import render_to_string
from .models import FlashCard
from .serializers import FlashCardSerializer

class FlashCardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return flashcards belonging to the current user
        return FlashCard.objects.filter(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        html = render_to_string('flashcards/_preview.html', {
            'flashcards': queryset
        })
        return Response({
            'data': serializer.data,
            'html': html
        })

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=isinstance(request.data, list))
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Handle both single item and list cases for getting IDs
        if isinstance(serializer.data, list):
            flashcard_ids = [item['id'] for item in serializer.data]
        else:
            flashcard_ids = [serializer.data['id']]

        # Get the flashcards and render the preview
        flashcards = FlashCard.objects.filter(id__in=flashcard_ids)
        html_parts = []
        for flashcard in flashcards:
            html_part = render_to_string('flashcards/_preview.html', {'flashcard': flashcard})
            html_parts.append(html_part)
        html = ''.join(html_parts)
        response_data = {
            'data': serializer.data,
            'html': html
        }

        headers = self.get_success_headers(serializer.data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
