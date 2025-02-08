from django.urls import path
from . import views
from . import api

app_name = 'voice_chat'

urlpatterns = [
    path('', views.VoiceChatView.as_view(), name='index'),
    path('api/session/', api.SessionAPIView.as_view(), name='session'),
]
