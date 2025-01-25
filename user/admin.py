from django import forms
from django.contrib import admin
from django.contrib.auth.models import Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField

from .models import CustomUser, UserNotifications


class UserCreationForm(forms.ModelForm):
    #A form for creating new users. Includes all the required
    #fields, plus a repeated password.
    phone = forms.CharField(label='Phone number', widget=forms.TextInput)
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput)

    class Meta:
        model = CustomUser
        fields = ('email','phone','is_premium','last_service_date','expires_on','subscription_count','gender','session_token','is_staff','is_active','is_superuser',)

    def clean_password2(self):
        # Check that the two password entries match
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        # Save the provided password in hashed format
        user = super(UserCreationForm, self).save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    #A form for updating users. Includes all the fields on
    #the user, but replaces the password field with admin's
    #password hash display field.
    
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = CustomUser
        fields = ('email', 'password', 'is_active','is_staff')

    def clean_password(self):
        # Regardless of what the user provides, return the initial value.
        # This is done here, rather than on the field, because the
        # field does not have access to the initial value
        return self.initial["password"]

class UserGroupInline(admin.StackedInline):
    model = Group

class UserAdmin(BaseUserAdmin):
    # The forms to add and change user instances
    form = UserChangeForm
    add_form = UserCreationForm

    # The fields to be used in displaying the User model.
    # These override the definitions on the base UserAdmin
    # that reference specific fields on auth.User.
    list_display = ('name','email','phone', 'is_active', 'is_staff','is_superuser','is_active',)
    list_filter = ('email',)
    fieldsets = (
        (None, {'fields': ('name','email', 'phone','password')}),
        ('Permissions', {'fields': ('is_staff','is_superuser','is_store','is_active',)}),
        ('Group Permissions', { 'fields': ('groups', 'user_permissions', )}),
    )
    
    # add_fieldsets is not a standard ModelAdmin attribute. UserAdmin
    # overrides get_fieldsets to use this attribute when creating a user.
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email','phone','is_superuser','is_active','password1', 'password2',)},
            
        ),
    )
    search_fields = ('email','phone',)
    ordering = ('email',)
    filter_horizontal = ()

admin.site.register(CustomUser, UserAdmin)
admin.site.register(UserNotifications)