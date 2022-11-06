from django.contrib import admin
from .models import Task
from .models import Task_auto


admin.site.register(Task)
admin.site.register(Task_auto)
