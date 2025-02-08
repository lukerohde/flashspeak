from django.urls import path
from . import views

app_name = 'voice_chat'

urlpatterns = [
    path('', views.VoiceChatView.as_view(), name='index'),
    path('api/session/', views.SessionAPIView.as_view(), name='session'),
]
