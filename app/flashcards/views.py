from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from .models import FlashCard
from .serializers import FlashCardSerializer

class FlashCardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashCardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return flashcards belonging to the current user
        return FlashCard.objects.filter(user=self.request.user)
    
    def create(self, request, *args, **kwargs):
        # Check if the data is a list
        is_many = isinstance(request.data, list)
        
        if is_many:
            serializer = self.get_serializer(data=request.data, many=True)
        else:
            serializer = self.get_serializer(data=request.data)
            
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
