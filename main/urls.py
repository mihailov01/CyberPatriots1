from django.urls import path
from . import views


urlpatterns = [
    path('',views.home,name = "home"),
    path('accounts/login/',views.autorization),
    path('create',views.create,name = 'create'),
    path('create2',views.create2,name = 'create2'),
    path('working',views.working,name = 'working'),
    path('working2',views.working2,name = 'working2'),
    path('start_funk/<int:pk>', views.start_funk, name='start_funk'),
    path('start_funk2/<int:pk>', views.start_funk2, name='start_funk2')
]
