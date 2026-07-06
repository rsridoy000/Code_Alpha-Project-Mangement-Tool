from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProjectViewSet, BoardListViewSet, TaskViewSet, CommentViewSet, AttachmentViewSet

router = DefaultRouter()
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'lists', BoardListViewSet, basename='boardlist')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'comments', CommentViewSet, basename='comment')
router.register(r'attachments', AttachmentViewSet, basename='attachment')


urlpatterns = [
    path('', include(router.urls)),
]
