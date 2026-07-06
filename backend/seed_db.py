import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from projects.models import Project, BoardList, Task, Comment

User = get_user_model()

def seed():
    print("Seeding database...")
    
    # Create Users
    u1, created = User.objects.get_or_create(username='admin')
    if created:
        u1.set_password('admin123')
        u1.email = 'admin@example.com'
        u1.is_superuser = True
        u1.is_staff = True
        u1.save()
        print("Created user: admin / admin123")
    else:
        print("User admin already exists")
        
    u2, created = User.objects.get_or_create(username='john_doe')
    if created:
        u2.set_password('john123')
        u2.email = 'john@example.com'
        u2.save()
        print("Created user: john_doe / john123")
        
    u3, created = User.objects.get_or_create(username='jane_smith')
    if created:
        u3.set_password('jane123')
        u3.email = 'jane@example.com'
        u3.save()
        print("Created user: jane_smith / jane123")

    # Create Demo Project
    project, created = Project.objects.get_or_create(
        name="🚀 CollabFlow Landing Page Design",
        description="Redesign the landing page to feature sleek glassmorphism themes and intuitive collaborative Kanban columns.",
        owner=u1
    )
    if created:
        project.members.add(u1, u2, u3)
        print("Created Demo Project")

        # Create Lists
        l1 = BoardList.objects.create(project=project, name="📋 Backlog", order=0)
        l2 = BoardList.objects.create(project=project, name="⚙️ In Progress", order=1)
        l3 = BoardList.objects.create(project=project, name="✅ Completed", order=2)
        print("Created Lists (Backlog, In Progress, Completed)")

        # Create Tasks
        t1 = Task.objects.create(
            board_list=l1,
            title="Design landing page wireframes",
            description="Sketch out the main layout. Ensure glassmorphism cards fit well within dark theme.",
            order=0,
            assigned_to=u2
        )
        t2 = Task.objects.create(
            board_list=l2,
            title="Integrate simple JWT auth on Backend",
            description="Ensure login, registration and /me endpoints are robust and secure.",
            order=0,
            assigned_to=u1
        )
        t3 = Task.objects.create(
            board_list=l3,
            title="Initialize React SPA structure",
            description="Use Vite to build out core React structure and add Router package.",
            order=0,
            assigned_to=u3
        )
        print("Created Demo Tasks")

        # Create Comments
        Comment.objects.create(
            task=t2,
            author=u2,
            text="I've tested the registration API locally, it works perfectly!"
        )
        Comment.objects.create(
            task=t2,
            author=u1,
            text="Excellent. Remember to set ACCESS_TOKEN_LIFETIME to 1 day."
        )
        print("Created Demo Comments")
    else:
        print("Demo project already exists")

    print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed()
