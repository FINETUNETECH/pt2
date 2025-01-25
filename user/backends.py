from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db.models import Q
import logging

UserModel = get_user_model()

class EmailBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):    
        try:
            user = UserModel.objects.get(Q(phone__iexact=username) | Q(email__iexact=username))
            if user.check_password(password):
                return user
            else:
                return None
        except UserModel.DoesNotExist:
            logging.getLogger("error_logger").error("user with login %s does not exists ")
            return None
        except Exception as e:
            logging.getLogger("error_logger").error(repr(e))
            return None