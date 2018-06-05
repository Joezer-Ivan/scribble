from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from notes.models import Note, NoteHistory
from notes.serializers import NoteSerializer, NoteHistorySerializer

def index(request):
    return render(request, 'notes/index.html')

@api_view(['GET', 'POST'])
def note_list(request):
    """
    List all notes, or create a new note.
    """
    if request.method == 'GET':
        notes = Note.objects.all()
        serializer = NoteSerializer(notes, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = NoteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
def note_detail(request, noteId):
    """
    Retrieve, update or delete a note.
    """
    try:
        note = Note.objects.get(pk=noteId)
    except Note.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = NoteSerializer(note)
        return Response(serializer.data)

    elif request.method == 'PUT':
        #move the current version of the note to the NoteHistory table before update
        note.notehistory_set.create(
            title=note.title,
            body=note.body,
            created_on=note.created_on
        )
        serializer = NoteSerializer(note, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        note.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
def note_history(request, noteId):
    """
    List all revisions of a note
    """
    if request.method == 'GET':
        noteHistory = NoteHistory.objects.filter(noteId=noteId)
        serializer = NoteHistorySerializer(noteHistory, many=True)
        return Response(serializer.data)

@api_view(['GET'])
def note_history_detail(request, historyId):
    """
    Get detaiils of a particular revision of a note
    """
    try:
        note = NoteHistory.objects.get(pk=historyId)
    except NoteHistory.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = NoteHistorySerializer(note)
        return Response(serializer.data)