
from django.db import models
from django.utils import timezone
from django import forms





class Task(models.Model):
    file = models.FileField('Файл',blank = False, default = '',upload_to='documents/')
    numbers = models.PositiveSmallIntegerField('Номер',blank = False, default='1')
    title =  models.CharField('Название',max_length=50, blank = False)
    created_date = models.DateTimeField( 'Дата создания',default=timezone.now,blank = False )
    status =  models.CharField('Статус',max_length=15, default="Активно", blank = False)
    

    class Meta:
        verbose_name = 'Исследование'
        verbose_name_plural = 'Исследования(ручная разметка)'
    
    def __str__(self):
        return self.title
    
    
    def publish(self):
        self.published_date = timezone.now()
        self.save()



class Task_auto(models.Model):
    file_a = models.FileField('Файл',blank = False, default = '',upload_to='documents/')
    numbers_a = models.PositiveSmallIntegerField('Номер',blank = False, default='1')
    title_a =  models.CharField('Название',max_length=50, blank = False)
    created_date_a = models.DateTimeField( 'Дата создания',default=timezone.now,blank = False )
    status_a =  models.CharField('Статус',max_length=15, default="Активно", blank = False)
    

    class Meta:
        verbose_name = 'Исследование'
        verbose_name_plural = 'Исследования(ИИ)'
    
    def __str__(self):
        return self.title_a
    
    
    def publish(self):
        self.published_date_a = timezone.now()
        self.save()


    
    