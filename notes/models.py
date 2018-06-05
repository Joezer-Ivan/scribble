from django.db import models

# Create your models here.

class Note(models.Model):
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    created_on = models.DateTimeField(auto_now=True)

    def __str__(self):
        return '%s %s %s' % (self.title, self.body, self.created_on)

class NoteHistory(models.Model):
    noteId = models.ForeignKey(Note, on_delete=models.CASCADE)
    title = models.CharField(max_length=200, blank=True)
    body = models.TextField(blank=True)
    created_on = models.DateTimeField()

    def __str__(self):
        return '%s %s %s %s' % (self.noteId, self.title, self.body, self.created_on)