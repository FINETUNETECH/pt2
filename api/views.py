from django.shortcuts import render
from django.views.decorators.csrf import csrf_protect
from django.middleware.csrf import get_token

# Create your views here.
def my_form_view(request):
    if request.method == 'POST':
        # Your POST handling logic here
        form_data = request.POST
        # Process the form data
        return HttpResponse('Form submitted successfully')
    
    # For GET requests, render the form
    return render(request, 'my_template.html', {
        'csrf_token': get_token(request),  # Explicitly get CSRF token
    })
