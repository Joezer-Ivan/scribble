from django.urls import path
from notes import views

urlpatterns = [
    path('', views.index),
    path('notes/', views.note_list),
    path('notes/<int:noteId>/', views.note_detail),
    path('notes/<int:noteId>/history/', views.note_history),
    path('notes/history/<int:historyId>/', views.note_history_detail),
]