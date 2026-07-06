from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Project, BoardList, Task, Comment, Attachment, ActivityLog
from users.serializers import UserSerializer

User = get_user_model()

class CommentSerializer(serializers.ModelSerializer):
    author_detail = UserSerializer(source='author', read_only=True)

    class Meta:
        model = Comment
        fields = ('id', 'task', 'author', 'author_detail', 'text', 'created_at')
        read_only_fields = ('author',)

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)


class AttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attachment
        fields = ('id', 'task', 'file', 'uploaded_at')


class TaskSerializer(serializers.ModelSerializer):
    comments = CommentSerializer(many=True, read_only=True)
    attachments = AttachmentSerializer(many=True, read_only=True)
    assigned_to_detail = UserSerializer(source='assigned_to', read_only=True)

    class Meta:
        model = Task
        fields = ('id', 'board_list', 'title', 'description', 'order', 'priority', 'due_date', 'assigned_to', 'assigned_to_detail', 'comments', 'attachments', 'created_at')


class BoardListSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = BoardList
        fields = ('id', 'project', 'name', 'order', 'tasks')


class ActivityLogSerializer(serializers.ModelSerializer):
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ('id', 'project', 'user', 'user_detail', 'action', 'created_at')


class ProjectSerializer(serializers.ModelSerializer):
    owner_detail = UserSerializer(source='owner', read_only=True)
    members_detail = UserSerializer(source='members', many=True, read_only=True)
    lists = BoardListSerializer(many=True, read_only=True)
    activities = ActivityLogSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = ('id', 'name', 'description', 'owner', 'owner_detail', 'members', 'members_detail', 'lists', 'activities', 'created_at')
        read_only_fields = ('owner',)

    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        members = validated_data.pop('members', [])
        project = Project.objects.create(**validated_data)
        project.members.add(self.context['request'].user)
        if members:
            project.members.add(*members)
        
        # Log project creation
        ActivityLog.objects.create(
            project=project,
            user=self.context['request'].user,
            action="created the project."
        )
        return project
