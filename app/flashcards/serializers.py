from rest_framework import serializers
from .models import FlashCard

class FlashCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlashCard
        fields = [
            'id', 'front', 'back', 'created_at', 'updated_at', 'tags',
            'front_last_review', 'front_interval', 'front_review_count',
            'front_easiness_factor', 'front_repetitions',
            'back_last_review', 'back_interval', 'back_review_count',
            'back_easiness_factor', 'back_repetitions'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'front_last_review', 'front_interval', 'front_review_count',
            'front_easiness_factor', 'front_repetitions',
            'back_last_review', 'back_interval', 'back_review_count',
            'back_easiness_factor', 'back_repetitions'
        ]

    def create(self, validated_data):
        # Automatically set the user to the current authenticated user
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
