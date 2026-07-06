from django.contrib import admin
from .models import Project, BoardList, Task, Comment, Attachment, ActivityLog

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'owner', 'created_at')
    search_fields = ('name', 'description')
    filter_horizontal = ('members',)

@admin.register(BoardList)
class BoardListAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'project', 'order')
    list_filter = ('project',)
    search_fields = ('name',)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'board_list', 'priority', 'due_date', 'assigned_to')
    list_filter = ('board_list__project', 'priority', 'due_date')
    search_fields = ('title', 'description')

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'author', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('text',)

@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'task', 'file', 'uploaded_at')

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'project', 'user', 'action', 'created_at')
    list_filter = ('project', 'created_at')
