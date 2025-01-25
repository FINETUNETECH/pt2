from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.apps import apps

class CustomUserManager(BaseUserManager):
    def _create_user(self, phone, password, email=None, username=None, **extra_fields):
        if not phone:
            raise ValueError('The given phone number must be set')
        if email:
            email = self.normalize_email(email)
        
        GlobalUserModel = apps.get_model(self.model._meta.app_label, self.model._meta.object_name)
        
        try:
            user = self.model(phone=phone, email=email, **extra_fields)
        except:
            user = self.model(phone=phone, **extra_fields)

        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, phone, password=None, email=None, username=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(phone, password, email, username, **extra_fields)

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self._create_user(phone, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    name = models.CharField(max_length=50, default='Anonymous')
    email = models.EmailField(max_length=254, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=255, unique=True)
    username = None
    
    is_premium = models.BooleanField(default=False)
    last_service_date = models.DateTimeField(null=True, blank=True)
    expires_on = models.DateField(null=True, blank=True)
    subscription_count = models.PositiveIntegerField(default=0)
    gender = models.CharField(max_length=10, blank=True, null=True)
    session_token = models.CharField(max_length=10, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    date_joined = models.DateTimeField(auto_now=True)
    
    is_staff = models.BooleanField(default=True)
    is_store = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []
    
    class Meta:
        app_label = 'custom_user'

    def get_full_name(self):
        return self.phone

    def get_short_name(self):
        return self.phone

    def __str__(self):
        return self.phone

    def has_perm(self, perm, obj=None):
        return True

    def has_module_perms(self, app_label):
        return True

class Kyc(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    name = models.CharField(max_length=255, help_text="KYC Document name ex: PAN, Driving licence etc.,", default="PAN Card")
    document = models.ImageField(upload_to='kyc/', null=True, blank=True)

class Gallery(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    images = models.ImageField(upload_to='gallery/', default='assets/images/user.png')
    is_profile_photo = models.BooleanField(default = False)

class UserNotifications(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    notification_heading = models.CharField(max_length=855)
    notification_content = models.TextField(max_length=1455)
    is_read = models.BooleanField(default=False)
    date_created = models.DateTimeField(auto_now=True)
    date_modified = models.DateTimeField(auto_now_add=True)

    def __str__(self):  # Fixed indentation here
        return f'{self.user.phone} - {self.notification_heading}'