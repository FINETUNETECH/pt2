from django.http import HttpResponse
from django.shortcuts import redirect

# Staff or superuser check
def check_staff_or_superuser(view_func):
    def wrapper_func(request, *args, **kwargs):
        if not request.user.is_superuser:
            return redirect('noaccesspage')

        return view_func(request, *args, **kwargs)

    return wrapper_func

def allowed_users(allowed_rules=[]):
    def decorator(view_func):
        def wrapper_func(request, *args, **kwargs):
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            groups = None
            if request.user.groups.exists():
                groups = request.user.groups.all()
            for group in groups:
                if group.name in allowed_rules:

                    return view_func(request, *args, **kwargs)
            else:
                return redirect('noaccesspage')
        
        return wrapper_func
    
    return decorator