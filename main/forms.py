from .models import Task
from django.forms import ModelForm,TextInput
from .models import Task_auto

class TaskForm(ModelForm):
    class Meta:
        model = Task
        fields = ["numbers","title","created_date","status","file"]
        widgets = {
            "title": TextInput(attrs={
                'placeholder': 'Введите название'
        })
        }     


class TaskForm_auto(ModelForm):
    class Meta:
        model = Task_auto
        fields = ["numbers_a","title_a","created_date_a","status_a","file_a"]
        widgets = {
            "title_a": TextInput(attrs={
                'placeholder': 'Введите название'
        })
        }             