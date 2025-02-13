# tests/factories.py
import factory
from django.contrib.auth.models import User
from flashcards.models import FlashCard

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        skip_postgeneration_save = True  # Prevents the automatic save after set_password

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    password = factory.PostGenerationMethodCall('set_password', 'password123')
    is_staff = False
    is_superuser = False
    is_active = True

    @factory.post_generation
    def password_save(obj, create, extracted, **kwargs):
        if create:
            obj.save()

class FlashCardFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = FlashCard
    
    user = factory.SubFactory(UserFactory)
    front = factory.Sequence(lambda n: f"Front of card {n}")
    back = factory.Sequence(lambda n: f"Back of card {n}")
    tags = factory.List([factory.Sequence(lambda n: f"tag{n}")])