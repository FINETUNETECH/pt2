#!/bin/bash

# Run database migrations
python manage.py migrate --noinput

# Start the application
exec python -m gunicorn finetuneOfficial.wsgi:application