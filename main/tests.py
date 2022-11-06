from django.test import TestCase

import cgi
form = cgi.FieldStorage()
value = form.getvalue('value')
