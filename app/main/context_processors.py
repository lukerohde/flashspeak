class DefaultApplication:
    def __init__(self, name = None):
        self.title = name if name else 'FlashSpeak'  # Default title when no application is selected

def generic_context(request):
    from main.models import Tutor
    tutors = Tutor.objects.all() if request.user.is_authenticated else Tutor.objects.none()
    return {
        'project_name': 'Your Project Name',
        'current_user': request.user,
        'application': getattr(request, 'tutor') or DefaultApplication(),  # Provides a default application object
        'tutor': getattr(request, 'tutor', None),  # Get tutor from request if available
        'tutors': tutors,  # All tutors for navigation.  Having tutor and tutors is odd!
    }