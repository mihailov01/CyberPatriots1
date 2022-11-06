import json
from django.shortcuts import render, redirect
from .models import Task, Task_auto
from .forms import TaskForm, TaskForm_auto
import sqlite3
from . import kontur
import os

def autorization(request):
    return render(request, 'registration/login.html')


def home (request):
    tasks = Task.objects.all().order_by('id')
    tasks_auto = Task_auto.objects.all().order_by('id')
    return render(request,'main/home.html',{'tasks': tasks,
    'tasks_auto': tasks_auto})


def working (request):
    tasks = Task.objects.all()
    return render(request,'main/html.html',{'tasks': tasks})


def create(request):
    error = ''
    if request.method == 'POST':
        form = TaskForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('home')
        else:
            form = TaskForm()
            error = 'Форма не корректна'
    form = TaskForm()
    context = {
        'form': form,
        'error': error
    }
    return render(request, 'main/create.html', context)


def create2(request):
    error = ''
    if request.method == 'POST':
        form = TaskForm_auto(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            return redirect('home')
        else:
            form = TaskForm_auto()
            error = 'Форма не корректна'
    form = TaskForm_auto()
    context = {
        'form': form,
        'error': error
    }
    return render(request, 'main/create2.html', context)


def working2 (request):
    tasks = Task_auto.objects.all()
    return render(request,'main/html2.html',{'tasks_auto': tasks})

def start_funk(request, pk):
    ask = f'SELECT * FROM main_task_auto WHERE id = {pk};'
    con = sqlite3.connect(r'CyberPatriots/db.sqlite3')
    cur = con.cursor()
    #cur.execute('SELECT * FROM sqlite_master WHERE type="table";')
    cur.execute(ask)
    res = cur.fetchall()
    arr_dcm = kontur.nii_to_dcm(f'/home/service/Рабочий стол/ии/CyberPatriots/media/{res[0][2]}')
    kontur.create_png(arr_dcm)

    tasks = Task_auto.objects.all()
    return render(request,'main/html2.html',{'tasks_auto': tasks})


def start_funk2(request, pk):
    ask = f'SELECT * FROM main_task WHERE id = {pk};'
    con = sqlite3.connect(r'CyberPatriots/db.sqlite3')
    cur = con.cursor()
    #cur.execute('SELECT * FROM sqlite_master WHERE type="table";')
    cur.execute(ask)
    res = cur.fetchall()
    name_file = res[0][5]
    
    

    tasks = Task_auto.objects.all()
    return render(request,'main/html.html',{'tasks': tasks,'name_file': name_file})