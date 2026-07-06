from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Project, BoardList, Task, Comment, Attachment, ActivityLog
from .serializers import (
    ProjectSerializer, BoardListSerializer, TaskSerializer, 
    CommentSerializer, AttachmentSerializer, ActivityLogSerializer
)

User = get_user_model()

class IsProjectMemberOrOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, Project):
            return obj.owner == request.user or request.user in obj.members.all()
        elif hasattr(obj, 'project'):
            return obj.project.owner == request.user or request.user in obj.project.members.all()
        elif hasattr(obj, 'board_list'):
            return obj.board_list.project.owner == request.user or request.user in obj.board_list.project.members.all()
        return False

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated, IsProjectMemberOrOwner]

    def get_queryset(self):
        return Project.objects.filter(Q(owner=self.request.user) | Q(members=self.request.user)).distinct()

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def add_member(self, request, pk=None):
        project = self.get_object()
        email_or_username = request.data.get('email_or_username')
        
        if not email_or_username:
            return Response({'error': 'Please provide an email or username'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Query user by email or username
            user = User.objects.get(Q(email=email_or_username) | Q(username=email_or_username))
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        if user in project.members.all():
            return Response({'error': 'User is already a member.'}, status=status.HTTP_400_BAD_REQUEST)
            
        project.members.add(user)
        ActivityLog.objects.create(
            project=project,
            user=request.user,
            action=f"added {user.username} to the project."
        )
        return Response({'message': f'Successfully added {user.username} to the project.'}, status=status.HTTP_200_OK)


class BoardListViewSet(viewsets.ModelViewSet):
    serializer_class = BoardListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BoardList.objects.filter(
            Q(project__owner=self.request.user) | Q(project__members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        board_list = serializer.save()
        ActivityLog.objects.create(
            project=board_list.project,
            user=self.request.user,
            action=f"created list '{board_list.name}'."
        )

    def perform_destroy(self, instance):
        project = instance.project
        list_name = instance.name
        instance.delete()
        ActivityLog.objects.create(
            project=project,
            user=self.request.user,
            action=f"deleted list '{list_name}'."
        )


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(
            Q(board_list__project__owner=self.request.user) | Q(board_list__project__members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        task = serializer.save()
        ActivityLog.objects.create(
            project=task.board_list.project,
            user=self.request.user,
            action=f"created task '{task.title}' in list '{task.board_list.name}'."
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Log status/list moves
        old_list = instance.board_list
        new_list_id = request.data.get('board_list')
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        updated_instance = self.get_object()
        if new_list_id and int(new_list_id) != old_list.id:
            ActivityLog.objects.create(
                project=updated_instance.board_list.project,
                user=request.user,
                action=f"moved task '{updated_instance.title}' from '{old_list.name}' to '{updated_instance.board_list.name}'."
            )
        
        return Response(serializer.data)

    def perform_destroy(self, instance):
        project = instance.board_list.project
        task_title = instance.title
        instance.delete()
        ActivityLog.objects.create(
            project=project,
            user=self.request.user,
            action=f"deleted task '{task_title}'."
        )


class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Comment.objects.filter(
            Q(task__board_list__project__owner=self.request.user) | Q(task__board_list__project__members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        comment = serializer.save()
        ActivityLog.objects.create(
            project=comment.task.board_list.project,
            user=self.request.user,
            action=f"commented on task '{comment.task.title}': '{comment.text[:30]}...'."
        )


class AttachmentViewSet(viewsets.ModelViewSet):
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Attachment.objects.filter(
            Q(task__board_list__project__owner=self.request.user) | Q(task__board_list__project__members=self.request.user)
        ).distinct()

    def perform_create(self, serializer):
        attachment = serializer.save()
        ActivityLog.objects.create(
            project=attachment.task.board_list.project,
            user=self.request.user,
            action=f"uploaded attachment for task '{attachment.task.title}'."
        )
